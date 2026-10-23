#!/usr/bin/env python3
"""
Fetch Google TTS audio files for vocabulary words in dataset JSONs.
Saves audio files as MD5 hash or sanitized filename in content/audio/.
"""

import os
import json
import hashlib
import urllib.request
import urllib.parse
import re

def clean_reading(text):
    """
    Extract kana/clean text for speech synthesis from Japanese text.
    For example: '学生(がくせい)' -> 'がくせい' or '学校(がっこう)' -> 'がっこう'.
    If furigana is inside parentheses, take parenthesized reading, otherwise keep string as is.
    """
    # Find all text inside parentheses
    matches = re.findall(r'[\(（]([^\)）]+)[\)）]', text)
    if matches:
        # Join furigana parts if string was e.g. "父(ちち) / お父(とう)さん"
        # For TTS, let's extract kana or strip parenthesized kanji/slashes
        # E.g., strip kanji before parenthesis
        cleaned = text
        # Remove kanji preceding parentheses: e.g. 学生(がくせい) -> がくせい
        cleaned = re.sub(r'[\u4e00-\u9faf\u3400-\u4dbf]+\(([^\)]+)\)', r'\1', cleaned)
        cleaned = re.sub(r'[\u4e00-\u9faf\u3400-\u4dbf]+（([^）]+)）', r'\1', cleaned)
        # Remove slash variations if any: e.g. "がくせい / てすと" -> "がくせい"
        if '/' in cleaned:
            cleaned = cleaned.split('/')[0].strip()
        return cleaned.strip()

    # If no parentheses, clean slashes e.g. "クラス / レッスン" -> "クラス"
    if '/' in text:
        text = text.split('/')[0].strip()
    return text.strip()

def get_audio_filename(text):
    """Generate consistent filename hash for text."""
    h = hashlib.md5(text.encode('utf-8')).hexdigest()
    return f"{h}.mp3"

def fetch_audio_for_dataset(json_path, output_dir='content/audio'):
    os.makedirs(output_dir, exist_ok=True)
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    words_processed = 0
    words_downloaded = 0

    topics = data.get('topics', [])
    for topic in topics:
        for sub in topic.get('subtopics', []):
            for word in sub.get('words', []):
                jp_text = word.get('japanese', '')
                if not jp_text:
                    continue

                tts_text = clean_reading(jp_text)
                filename = get_audio_filename(jp_text)
                filepath = os.path.join(output_dir, filename)

                words_processed += 1
                if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
                    continue

                encoded_text = urllib.parse.quote(tts_text)
                url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={encoded_text}&tl=ja&client=tw-ob"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                try:
                    with urllib.request.urlopen(req) as resp, open(filepath, 'wb') as out_file:
                        out_file.write(resp.read())
                    words_downloaded += 1
                    print(f"Downloaded [{tts_text}] -> {filename}")
                except Exception as e:
                    print(f"Failed to fetch audio for '{jp_text}' ({tts_text}): {e}")

    print(f"Finished processing {json_path}: {words_processed} total, {words_downloaded} downloaded.")

if __name__ == '__main__':
    json_file = 'content/marugoto_a1_vocabulary.json'
    if os.path.exists(json_file):
        fetch_audio_for_dataset(json_file)
    else:
        print(f"Dataset file {json_file} not found.")
