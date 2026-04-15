"""
EchoSign Translation Utilities
Contains mappings for the 30 standard sign language words.
"""

SIGN_TRANSLATIONS = {
    "Hello": {
        "ml": "ഹലോ",
        "hi": "नमस्ते"
    },
    "Thank You": {
        "ml": "നന്ദി",
        "hi": "धन्यवाद"
    },
    "Please": {
        "ml": "ദയവായി",
        "hi": "कृपया"
    },
    "Sorry": {
        "ml": "ക്ഷമിക്കണം",
        "hi": "माफ़ कीजिये"
    },
    "Yes": {
        "ml": "അതെ",
        "hi": "हाँ"
    },
    "No": {
        "ml": "ഇല്ല",
        "hi": "नहीं"
    },
    "Help": {
        "ml": "സഹായിക്കൂ",
        "hi": "मदद"
    },
    "Doctor": {
        "ml": "ഡോക്ടർ",
        "hi": "डॉक्टर"
    },
    "Emergency": {
        "ml": "അടിയന്തരാവസ്ഥ",
        "hi": "आपातकालीन"
    },
    "Water": {
        "ml": "വെള്ളം",
        "hi": "पानी"
    },
    "Food": {
        "ml": "ഭക്ഷണം",
        "hi": "खाना"
    },
    "Good": {
        "ml": "നല്ലത്",
        "hi": "अच्छा"
    },
    "Bad": {
        "ml": "മോശം",
        "hi": "बुरा"
    },
    "Love": {
        "ml": "സ്നേഹം",
        "hi": "प्यार"
    },
    "Family": {
        "ml": "കുടുംബം",
        "hi": "परिवार"
    },
    "Friend": {
        "ml": "സുഹൃത്ത്",
        "hi": "दोस्त"
    },
    "Home": {
        "ml": "വീട്",
        "hi": "घर"
    },
    "School": {
        "ml": "സ്കൂൾ",
        "hi": "स्कूल"
    },
    "Hospital": {
        "ml": "ആശുപത്രി",
        "hi": "अस्पताल"
    },
    "Police": {
        "ml": "പോലീസ്",
        "hi": "पुलिस"
    },
    "Fire": {
        "ml": "തീ",
        "hi": "आग"
    },
    "Ambulance": {
        "ml": "ആംബുലൻസ്",
        "hi": "एम्बुलेंस"
    },
    "Danger": {
        "ml": "അപകടം",
        "hi": "खतरा"
    },
    "Stop": {
        "ml": "നിൽക്കൂ",
        "hi": "रुकिए"
    },
    "Go": {
        "ml": "പോകൂ",
        "hi": "जाइये"
    },
    "Come": {
        "ml": "വരൂ",
        "hi": "आइये"
    },
    "Wait": {
        "ml": "കാത്തുനിൽക്കൂ",
        "hi": "इंतज़ार"
    },
    "Understand": {
        "ml": "മനസ്സിലായി",
        "hi": "समझ में आया"
    },
    "Again": {
        "ml": "വീണ്ടും",
        "hi": "फिर से"
    },
    "More": {
        "ml": "കൂടുതൽ",
        "hi": "और"
    }
}

def translate_sign(word, target_lang='en'):
    """
    Translates an English sign word into the target language.
    Returns the translated word or the original if no translation exists.
    """
    if not target_lang or target_lang == 'en':
        return word
    
    # Check direct match
    translations = SIGN_TRANSLATIONS.get(word)
    if translations:
        return translations.get(target_lang, word)
    
    # Case insensitive check
    for en_word, langs in SIGN_TRANSLATIONS.items():
        if en_word.lower() == word.lower():
            return langs.get(target_lang, word)
            
    return word

def get_full_translation(word, target_lang='en'):
    """
    Returns a combined string if target_lang is not English.
    Example: "Hello (ഹലോ)"
    """
    translated = translate_sign(word, target_lang)
    if target_lang != 'en' and translated != word:
        return f"{word} ({translated})"
    return word
