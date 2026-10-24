#!/usr/bin/env python3
"""
Fetch Google TTS audio files for vocabulary words and Kana characters.
Saves audio files in content/audio/ and maintains content/audio_map.json.
"""

import os
import json
import hashlib
import urllib.request
import urllib.parse
import re

HIRAGANA_CHARS = [
    'あ', 'い', 'う', 'え', 'お',
    'か', 'き', 'く', 'け', 'こ',
    'さ', 'し', 'す', 'せ', 'そ',
    'た', 'ち', 'つ', 'て', 'と',
    'な', 'に', 'ぬ', 'ね', 'の',
    'は', 'ひ', 'ふ', 'へ', 'ほ',
    'ま', 'み', 'む', 'め', 'も',
    'や', 'ゆ', 'よ',
    'ら', 'り', 'る', 'れ', 'ろ',
    'わ', 'を',
    'ん'
]

KATAKANA_CHARS = [
    'ア', 'イ', 'ウ', 'エ', 'オ',
    'カ', 'キ', 'ク', 'ケ', 'コ',
    'サ', 'シ', 'ス', 'セ', 'ソ',
    'タ', 'チ', 'ツ', 'テ', 'ト',
    'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
    'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
    'マ', 'ミ', 'ム', 'メ', 'モ',
    'ヤ', 'ユ', 'ヨ',
    'ラ', 'リ', 'ル', 'レ', 'ロ',
    'ワ', 'ヲ',
    'ン'
]

def clean_reading(text):
    """
    Extract kana/clean text for speech synthesis from Japanese text.
    For example: '学生(がくせい)' -> 'がくせい' or '学校(がっこう)' -> 'がっこう'.
    """
    matches = re.findall(r'[\(（]([^\)）]+)[\)）]', text)
    if matches:
        cleaned = text
        cleaned = re.sub(r'[\u4e00-\u9faf\u3400-\u4dbf]+\(([^\)]+)\)', r'\1', cleaned)
        cleaned = re.sub(r'[\u4e00-\u9faf\u3400-\u4dbf]+（([^）]+)）', r'\1', cleaned)
        if '/' in cleaned:
            cleaned = cleaned.split('/')[0].strip()
        return cleaned.strip()

    if '/' in text:
        text = text.split('/')[0].strip()
    return text.strip()

def get_audio_filename(text):
    """Generate consistent filename hash for text."""
    h = hashlib.md5(text.encode('utf-8')).hexdigest()
    return f"{h}.mp3"

def fetch_and_save(text, tts_text, output_dir, audio_map):
    filename = get_audio_filename(text)
    filepath = os.path.join(output_dir, filename)

    audio_map[text] = filename
    if tts_text != text:
        audio_map[tts_text] = filename

    if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
        return False

    encoded_text = urllib.parse.quote(tts_text)
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={encoded_text}&tl=ja&client=tw-ob"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp, open(filepath, 'wb') as out_file:
            out_file.write(resp.read())
        print(f"Downloaded [{text}] ({tts_text}) -> {filename}")
        return True
    except Exception as e:
        print(f"Failed to fetch audio for '{text}' ({tts_text}): {e}")
        return False

def main():
    output_dir = 'content/audio'
    map_file = 'content/audio_map.json'
    os.makedirs(output_dir, exist_ok=True)

    audio_map = {}
    if os.path.exists(map_file):
        try:
            with open(map_file, 'r', encoding='utf-8') as f:
                audio_map = json.load(f)
        except Exception as e:
            print(f"Error loading existing audio_map.json: {e}")

    downloaded = 0

    # 1. Fetch audio for all Kana characters
    all_kana = HIRAGANA_CHARS + KATAKANA_CHARS
    for char in all_kana:
        if fetch_and_save(char, char, output_dir, audio_map):
            downloaded += 1

    # 2. Fetch audio for dataset vocabulary
    json_file = 'content/marugoto_a1_vocabulary.json'
    if os.path.exists(json_file):
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for topic in data.get('topics', []):
            for sub in topic.get('subtopics', []):
                for word in sub.get('words', []):
                    jp_text = word.get('japanese', '')
                    if not jp_text:
                        continue
                    tts_text = clean_reading(jp_text)
                    if fetch_and_save(jp_text, tts_text, output_dir, audio_map):
                        downloaded += 1

    # Save audio_map.json
    with open(map_file, 'w', encoding='utf-8') as f:
        json.dump(audio_map, f, ensure_ascii=False, indent=2)

    print(f"Audio sync complete. Downloaded {downloaded} new files. Total mapped entries: {len(audio_map)}.")

if __name__ == '__main__':
    main()
