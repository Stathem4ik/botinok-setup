import random
import sqlite3
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"
DB_PATH = BASE_DIR / "data" / "game.db"
SUPPORT_BOT_USERNAME = "ВСТАВЬ_ЮЗЕРНЕЙМ_САППОРТ_БОТА"

MOBS = [
    ("Гнилой Слизень", 30, 5, 18, 14),
    ("Дикий Кабан", 45, 8, 28, 22),
    ("Скелет-Страж", 65, 12, 42, 34),
    ("Тёмный Мародёр", 90, 16, 65, 52),
]

BOSSES = [
    ("Железный Голем", 1, 600),
    ("Повелитель Пепла", 2, 1100),
    ("Древний Левиафан", 3, 1800),
]

app = Flask(__name__, static_folder=str(WEB_DIR))


def get_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS heroes (
                user_id INTEGER PRIMARY KEY,
                name TEXT DEFAULT 'Игрок',
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                hp INTEGER DEFAULT 100,
                max_hp INTEGER DEFAULT 100,
                atk INTEGER DEFAULT 14,
                gold INTEGER DEFAULT 30,
                boss_damage INTEGER DEFAULT 0
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS raid_boss (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                name TEXT,
                level INTEGER,
                hp INTEGER,
                max_hp INTEGER
            )
        """)
        row = conn.execute("SELECT id FROM raid_boss WHERE id = 1").fetchone()
        if not row:
            b_name, b_lvl, b_hp = BOSSES[0]
            conn.execute(
                "INSERT INTO raid_boss (id, name, level, hp, max_hp) VALUES (1, ?, ?, ?, ?)",
                (b_name, b_lvl, b_hp, b_hp),
            )
        conn.commit()


def need_exp(level: int) -> int:
    return level * 100


def upgrade_cost(level: int) -> int:
    return level * 25


def get_or_create_hero(user_id: int, name: str | None = None) -> dict:
    clean_name = (name or f"Герой_{user_id}")[:32]
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM heroes WHERE user_id = ?", (user_id,)).fetchone()
        if row:
            if name:
                conn.execute("UPDATE heroes SET name = ? WHERE user_id = ?", (clean_name, user_id))
                conn.commit()
                row = conn.execute("SELECT * FROM heroes WHERE user_id = ?", (user_id,)).fetchone()
            return dict(row)

        conn.execute("INSERT INTO heroes (user_id, name) VALUES (?, ?)", (user_id, clean_name))
        conn.commit()
        return dict(conn.execute("SELECT * FROM heroes WHERE user_id = ?", (user_id,)).fetchone())


def get_boss() -> dict:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM raid_boss WHERE id = 1").fetchone()
        return dict(row)


def rotate_boss_if_dead(conn, boss: dict) -> dict:
    if boss["hp"] > 0:
        return boss
    next_lvl = boss["level"] + 1
    idx = (next_lvl - 1) % len(BOSSES)
    scale = 1 + ((next_lvl - 1) // len(BOSSES))
    b_name, _, base_hp = BOSSES[idx]
    b_hp = base_hp * scale
    conn.execute(
        "UPDATE raid_boss SET name = ?, level = ?, hp = ?, max_hp = ? WHERE id = 1",
        (b_name, next_lvl, b_hp, b_hp),
    )
    conn.commit()
    return dict(conn.execute("SELECT * FROM raid_boss WHERE id = 1").fetchone())


@app.route("/")
def index():
    return send_from_directory(WEB_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(WEB_DIR, filename)


@app.route("/api/state", methods=["POST"])
def api_state():
    data = request.get_json(silent=True) or {}
    user_id = int(data.get("user_id") or 10001)
    name = data.get("name")
    hero = get_or_create_hero(user_id, name)
    with get_conn() as conn:
        boss = rotate_boss_if_dead(conn, get_boss())
    return jsonify({
        "hero": hero,
        "boss": boss,
        "need_exp": need_exp(hero["level"]),
        "upgrade_cost": upgrade_cost(hero["level"]),
        "support_url": f"https://t.me/{SUPPORT_BOT_USERNAME}" if not SUPPORT_BOT_USERNAME.startswith("ВСТАВЬ") else "",
    })


@app.route("/api/hunt", methods=["POST"])
def api_hunt():
    data = request.get_json(silent=True) or {}
    user_id = int(data.get("user_id") or 10001)
    hero = get_or_create_hero(user_id, data.get("name"))

    if hero["hp"] <= 5:
        return jsonify({"error": "Мало HP! Нажми «Лечение» перед вылазкой."}), 400

    pool = MOBS[: min(len(MOBS), hero["level"] + 1)]
    mob_name, mob_hp, mob_atk, exp_rew, gold_rew = random.choice(pool)

    p_hp = hero["hp"]
    p_atk = hero["atk"]
    rounds = 0

    while p_hp > 0 and mob_hp > 0 and rounds < 15:
        rounds += 1
        mob_hp -= random.randint(int(p_atk * 0.8), int(p_atk * 1.25))
        if mob_hp <= 0:
            break
        p_hp -= random.randint(max(1, int(mob_atk * 0.7)), int(mob_atk * 1.15))

    with get_conn() as conn:
        if mob_hp <= 0:
            exp = hero["exp"] + exp_rew
            gold = hero["gold"] + gold_rew
            lvl = hero["level"]
            max_hp = hero["max_hp"]
            atk = hero["atk"]
            leveled = False

            while exp >= need_exp(lvl):
                exp -= need_exp(lvl)
                lvl += 1
                max_hp += 20
                atk += 4
                p_hp = max_hp
                leveled = True

            p_hp = max(1, p_hp)
            conn.execute(
                "UPDATE heroes SET hp = ?, exp = ?, gold = ?, level = ?, max_hp = ?, atk = ? WHERE user_id = ?",
                (p_hp, exp, gold, lvl, max_hp, atk, user_id),
            )
            log_msg = f"Победа над {mob_name}: +{exp_rew} EXP, +{gold_rew} 💰" + (" — НОВЫЙ УРОВЕНЬ!" if leveled else "")
        else:
            p_hp = max(10, hero["max_hp"] // 2)
            conn.execute("UPDATE heroes SET hp = ? WHERE user_id = ?", (p_hp, user_id))
            log_msg = f"Поражение от {mob_name}. Отступил в лагерь ({p_hp} HP)."
        conn.commit()

    updated = get_or_create_hero(user_id)
    return jsonify({
        "log": log_msg,
        "hero": updated,
        "boss": get_boss(),
        "need_exp": need_exp(updated["level"]),
        "upgrade_cost": upgrade_cost(updated["level"]),
    })


@app.route("/api/raid-hit", methods=["POST"])
def api_raid_hit():
    data = request.get_json(silent=True) or {}
    user_id = int(data.get("user_id") or 10001)
    hero = get_or_create_hero(user_id, data.get("name"))
    dmg = max(1, int(hero["atk"] * 1.15))

    with get_conn() as conn:
        boss = rotate_boss_if_dead(conn, get_boss())
        new_hp = max(0, boss["hp"] - dmg)
        conn.execute("UPDATE raid_boss SET hp = ? WHERE id = 1", (new_hp,))

        extra_gold = 0
        extra_exp = 0
        killed = False
        if new_hp == 0:
            killed = True
            extra_gold = boss["level"] * 70
            extra_exp = boss["level"] * 90

        conn.execute(
            """
            UPDATE heroes
            SET boss_damage = boss_damage + ?,
                gold = gold + ?,
                exp = exp + ?
            WHERE user_id = ?
            """,
            (dmg, extra_gold, extra_exp, user_id),
        )
        conn.commit()

    updated = get_or_create_hero(user_id)
    log_msg = f"Удар по боссу на {dmg} урона!" + (f" ДОБИЛ! +{extra_gold} 💰, +{extra_exp} EXP" if killed else "")
    return jsonify({
        "log": log_msg,
        "hero": updated,
        "boss": get_boss(),
        "need_exp": need_exp(updated["level"]),
        "upgrade_cost": upgrade_cost(updated["level"]),
    })


@app.route("/api/upgrade", methods=["POST"])
def api_upgrade():
    data = request.get_json(silent=True) or {}
    user_id = int(data.get("user_id") or 10001)
    kind = data.get("kind")
    hero = get_or_create_hero(user_id, data.get("name"))

    with get_conn() as conn:
        if kind == "atk":
            cost = upgrade_cost(hero["level"])
            if hero["gold"] < cost:
                return jsonify({"error": f"Нужно {cost} 💰"}), 400
            conn.execute(
                "UPDATE heroes SET gold = gold - ?, atk = atk + 3 WHERE user_id = ?",
                (cost, user_id),
            )
            log_msg = f"Атака +3 (-{cost} 💰)"
        elif kind == "heal":
            cost = 15
            if hero["hp"] >= hero["max_hp"]:
                return jsonify({"error": "HP уже полное"}), 400
            if hero["gold"] < cost:
                return jsonify({"error": f"Нужно {cost} 💰"}), 400
            conn.execute(
                "UPDATE heroes SET gold = gold - ?, hp = max_hp WHERE user_id = ?",
                (cost, user_id),
            )
            log_msg = f"HP восстановлено (-{cost} 💰)"
        else:
            return jsonify({"error": "Неизвестное действие"}), 400
        conn.commit()

    updated = get_or_create_hero(user_id)
    return jsonify({
        "log": log_msg,
        "hero": updated,
        "boss": get_boss(),
        "need_exp": need_exp(updated["level"]),
        "upgrade_cost": upgrade_cost(updated["level"]),
    })


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5050, debug=False)

if __name__ == '__main__':
    pass

if __name__ == '__main__':
    pass
