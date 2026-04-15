/**
 * EcoSign Frontend Translation Utility
 * Local mapping for signs and UI labels.
 */

export const SIGN_MAP = {
    "Hello": { ml: "ഹലോ", hi: "नमस्ते" },
    "Thank You": { ml: "നന്ദി", hi: "धन्यवाद" },
    "Please": { ml: "ദയവായി", hi: "कृपया" },
    "Sorry": { ml: "ക്ഷമിക്കണം", hi: "माफ़ कीजिये" },
    "Yes": { ml: "അതെ", hi: "हाँ" },
    "No": { ml: "ഇല്ല", hi: "नहीं" },
    "Help": { ml: "സഹായിക്കൂ", hi: "मदद" },
    "Doctor": { ml: "ഡോക്ടർ", hi: "डॉक्टर" },
    "Emergency": { ml: "അടിയന്തരാവസ്ഥ", hi: "आपातकालीन" },
    "Water": { ml: "വെള്ളം", hi: "पानी" },
    "Food": { ml: "ഭക്ഷണം", hi: "खाना" },
    "Good": { ml: "നല്ലത്", hi: "अच्छा" },
    "Bad": { ml: "മോശം", hi: "बुरा" },
    "Love": { ml: "സ്നേഹം", hi: "प्यार" },
    "Family": { ml: "കുടുംബം", hi: "परिवार" },
    "Friend": { ml: "സുഹൃത്ത്", hi: "दोस्त" },
    "Home": { ml: "വീട്", hi: "घर" },
    "School": { ml: "സ്കൂൾ", hi: "स्कूल" },
    "Hospital": { ml: "ആശുപത്രി", hi: "अस्पताल" },
    "Police": { ml: "പോലീസ്", hi: "पुलिस" },
    "Fire": { ml: "തീ", hi: "आग" },
    "Ambulance": { ml: "ആംബുലൻസ്", hi: "एम्बुलेंस" },
    "Danger": { ml: "അപകടം", hi: "खतरा" },
    "Stop": { ml: "നിൽക്കൂ", hi: "रुकिए" },
    "Go": { ml: "പോകൂ", hi: "जाइये" },
    "Come": { ml: "വരൂ", hi: "आइये" },
    "Wait": { ml: "കാത്തുനിൽക്കൂ", hi: "इंतज़ार" },
    "Understand": { ml: "മനസ്സിലായി", hi: "समझ में आया" },
    "Again": { ml: "വീണ്ടും", hi: "फिर से" },
    "More": { ml: "കൂടുതൽ", hi: "और" }
};

export const UI_LABELS = {
    en: {
        nav_home: "Home", nav_translator: "Translator", nav_history: "History", nav_emergency: "Emergency", nav_settings: "Settings", nav_ai_active: "AI Active",
        home_hero_title: "Bridge the Communication Gap", home_hero_subtitle: "with AI Sign Language", home_hero_desc: "EchoSign translates hand gestures into text and speech in real-time.",
        home_btn_start: "Start Translating", home_btn_history: "View History",
        home_stat_signs: "Signs Supported", home_stat_fps: "Real-Time FPS", home_stat_offline: "Offline Mode", home_stat_accuracy: "Accuracy Target",
        trans_title: "Real-Time Translator", trans_desc: "Position your hand in front of the camera.", trans_no_hand: "No Hand Detected", trans_hand_detected: "Hand Detected",
        trans_speak: "Speak", trans_clear: "Clear", trans_add: "Add to Sentence", trans_confidence: "Confidence",
        hist_title: "Translation History", hist_stats_total: "Total Translations", hist_stats_today: "Today's Signs", hist_stats_em: "Active Emergencies", hist_stats_conf: "Avg. Confidence",
        hist_table_word: "Word / Sign", hist_table_conf: "Confidence", hist_table_type: "Type", hist_table_time: "Date & Time",
        em_title: "Emergency Center", em_desc: "Manually trigger alerts or view active emergencies.", em_active: "Active Emergency Alerts",
        em_ref_title: "Emergency Sign Reference", em_btn_trigger: "Trigger", em_btn_sending: "Sending...",
        sett_title: "Settings", sett_contacts: "WhatsApp Contacts", sett_add_contact: "Add Contact", sett_sys_status: "System Status", sett_tts_test: "TTS Voice Test"
    },
    ml: {
        nav_home: "ഹോം", nav_translator: "വിവർത്തനം", nav_history: "ചരിത്രം", nav_emergency: "അടിയന്തരാവസ്ഥ", nav_settings: "ക്രമീകരണങ്ങൾ", nav_ai_active: "AI സജീവമാണ്",
        home_hero_title: "ആശയവിനിമയ വിടവ് നികത്താം", home_hero_subtitle: "AI ചിഹ്നഭാഷയിലൂടെ", home_hero_desc: "എക്കോസൈൻ കൈ ആംഗ്യങ്ങളെ തത്സമയം ടെക്സ്റ്റിലേക്കും സംസാരത്തിലേക്കും വിവർത്തനം ചെയ്യുന്നു.",
        home_btn_start: "വിവർത്തനം തുടങ്ങുക", home_btn_history: "ചരിത്രം കാണുക",
        home_stat_signs: "ചിഹ്നങ്ങൾ", home_stat_fps: "തത്സമയ വേഗത", home_stat_offline: "ഓഫ്‌ലൈൻ മോഡ്", home_stat_accuracy: "കൃത്യത ലക്ഷ്യം",
        trans_title: "തത്സമയ വിവർത്തനം", trans_desc: "ക്യാമറയ്ക്ക് മുന്നിൽ കൈ കാണിക്കുക.", trans_no_hand: "കൈ കണ്ടെത്തിയില്ല", trans_hand_detected: "കൈ കണ്ടെത്തി",
        trans_speak: "സംസാരിക്കുക", trans_clear: "മായ്ക്കുക", trans_add: "വാക്യത്തിൽ ചേർക്കുക", trans_confidence: "വിശ്വാസ്യത",
        hist_title: "വിവർത്തന ചരിത്രം", hist_stats_total: "ആകെ", hist_stats_today: "ഇന്നത്തെ ചിഹ്നങ്ങൾ", hist_stats_em: "സജീവമായ അടിയന്തരാവസ്ഥ", hist_stats_conf: "കൃത്യത ശരാശരി",
        hist_table_word: "ചിഹ്നം / വാക്ക്", hist_table_conf: "വിശ്വാസ്യത", hist_table_type: "തരം", hist_table_time: "തിയതിയും സമയവും",
        em_title: "അടിയന്തര കേന്ദ്രം", em_desc: "അലേർട്ടുകൾ ട്രിഗർ ചെയ്യുക അല്ലെങ്കിൽ സജീവ അടിയന്തര സാഹചര്യങ്ങൾ കാണുക.", em_active: "സജീവമായ അടിയന്തര അലേർട്ടുകൾ",
        em_ref_title: "അടിയന്തര ചിഹ്ന റഫറൻസ്", em_btn_trigger: "ട്രിഗർ", em_btn_sending: "അയക്കുന്നു...",
        sett_title: "ക്രമീകരണങ്ങൾ", sett_contacts: "വാട്സാപ്പ് കോൺടാക്റ്റുകൾ", sett_add_contact: "ചേർക്കുക", sett_sys_status: "സിസ്റ്റം നില", sett_tts_test: "വോയിസ് ടെസ്റ്റ്"
    },
    hi: {
        nav_home: "होम", nav_translator: "अनुवादक", nav_history: "इतिहास", nav_emergency: "आपातकालीन", nav_settings: "सेटिंग्स", nav_ai_active: "एआई सक्रिय",
        home_hero_title: "संचार की कमी दूर करें", home_hero_subtitle: "एआई सांकेतिक भाषा के साथ", home_hero_desc: "इकोसाइन हाथ के इशारों को रीयल-टाइम में टेक्स्ट और स्पीच में अनुवाद करता है।",
        home_btn_start: "अनुवाद शुरू करें", home_btn_history: "इतिहास देखें",
        home_stat_signs: "समर्थित संकेत", home_stat_fps: "रीयल-टाइम गति", home_stat_offline: "ऑफलाइन मोड", home_stat_accuracy: "सटीकता लक्ष्य",
        trans_title: "रीयल-टाइम अनुवादक", trans_desc: "कैमरे के सामने अपना हाथ रखें।", trans_no_hand: "कोई हाथ नहीं मिला", trans_hand_detected: "हाथ मिल गया",
        trans_speak: "बोलें", trans_clear: "साफ़ करें", trans_add: "वाक्य में जोड़ें", trans_confidence: "आत्मविश्वास",
        hist_title: "अनुवाद इतिहास", hist_stats_total: "कुल अनुवाद", hist_stats_today: "आज के संकेत", hist_stats_em: "सक्रिय आपात स्थिति", hist_stats_conf: "औसत आत्मविश्वास",
        hist_table_word: "शब्द / संकेत", hist_table_conf: "आत्मविश्वास", hist_table_type: "प्रकार", hist_table_time: "दिनांक और समय",
        em_title: "आपातकालीन केंद्र", em_desc: "अलर्ट ट्रिगर करें या सक्रिय आपात स्थितियां देखें।", em_active: "सक्रिय आपातकालीन अलर्ट",
        em_ref_title: "आपातकालीन संकेत संदर्भ", em_btn_trigger: "ट्रिगर", em_btn_sending: "भेजा जा रहा है...",
        sett_title: "सेटिंग्स", sett_contacts: "व्हाट्सएप संपर्क", sett_add_contact: "संपर्क जोड़ें", sett_sys_status: "सिस्टम की स्थिति", sett_tts_test: "आवाज परीक्षण"
    }
};

export function getFullTranslation(word, lang) {
    if (!word) return "";
    if (!lang || lang === 'en') return word;
    
    // Check if word already contains translation like "Hello (ഹലോ)"
    if (word.includes("(") && word.includes(")")) return word;

    const entry = SIGN_MAP[word];
    if (entry && entry[lang]) {
        return `${word} (${entry[lang]})`;
    }
    return word;
}
