#!/data/data/com.termux/files/usr/bin/bash
cd ~/rpg_game || exit 1
cp -r ~/tg_junior_bot/rpg_game/* ~/rpg_game/ 2>/dev/null || true
python server.py
