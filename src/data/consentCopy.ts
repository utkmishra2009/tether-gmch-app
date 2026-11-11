// Plain-language privacy notice (DPDP Act 2023, s.5). Wording is a draft for the hospital's legal team to confirm.
export type Lang = 'en' | 'hi';

export type CopyPurpose = 'care' | 'reminders' | 'whatsapp' | 'marketing' | 'research';
export const PURPOSES: Record<CopyPurpose, { required: boolean; en: { title: string; desc: string }; hi: { title: string; desc: string } }> = {
  care: {
    required: true,
    en: { title: 'Care & records in Tether', desc: 'Use my mobile number and health records to verify me by OTP and show my appointments, reports, medicines and bills.' },
    hi: { title: 'Tether में इलाज और रिकॉर्ड', desc: 'OTP से मेरी पहचान करने और मेरी अपॉइंटमेंट, रिपोर्ट, दवाइयाँ और बिल दिखाने के लिए मेरा मोबाइल नंबर और स्वास्थ्य रिकॉर्ड उपयोग करें।' },
  },
  reminders: {
    required: false,
    en: { title: 'Reminders by SMS & app', desc: 'Appointment, report-ready and dose reminders.' },
    hi: { title: 'SMS और ऐप रिमाइंडर', desc: 'अपॉइंटमेंट, रिपोर्ट तैयार और दवा के रिमाइंडर।' },
  },
  whatsapp: {
    required: false,
    en: { title: 'WhatsApp & calls', desc: 'Updates and follow-ups on WhatsApp or by phone call.' },
    hi: { title: 'WhatsApp और कॉल', desc: 'WhatsApp या फ़ोन कॉल पर अपडेट और फ़ॉलो-अप।' },
  },
  marketing: {
    required: false,
    en: { title: 'Health camps & offers', desc: 'Invitations to health camps and hospital offers. Never uses your clinical details.' },
    hi: { title: 'हेल्थ कैंप और ऑफ़र', desc: 'हेल्थ कैंप और अस्पताल के ऑफ़र के निमंत्रण। आपकी चिकित्सा जानकारी का उपयोग नहीं होता।' },
  },
  research: {
    required: false,
    en: { title: 'Quality & research (de-identified)', desc: 'Use my records, with my name and contact removed, to improve hospital care and research.' },
    hi: { title: 'गुणवत्ता और शोध (पहचान हटाकर)', desc: 'मेरा नाम और संपर्क हटाकर मेरे रिकॉर्ड का उपयोग अस्पताल की सेवा सुधारने और शोध के लिए करें।' },
  },
};

export const NOTICE = {
  en: {
    title: 'How we use your data',
    intro: 'Here is what Tether does with your information. You can change your choices any time in Profile → Privacy & Consent.',
    sections: [
      { h: 'What we collect', b: 'Name, mobile number, date of birth, UHID, appointments, test reports, prescriptions, bills, and records of your visits and admissions.' },
      { h: 'Why', b: 'To give you care and let you view and manage it in this app. Optional uses are only done if you switch them on.' },
      { h: 'Who can see it', b: 'Your treating doctors and authorised hospital staff. Family members only if you grant them access. We do not sell your data.' },
      { h: 'How long we keep it', b: 'Medical records are kept for the period required by law. Other data is deleted when you withdraw consent or ask us to erase it, unless the law needs us to keep it.' },
      { h: 'Your rights', b: 'See a copy of your data, correct it, erase it, withdraw consent as easily as you gave it, nominate someone to act for you, and complain to us. If we do not resolve it, you may complain to the Data Protection Board of India.' },
      { h: 'Children', b: 'For anyone under 18, a parent or lawful guardian gives consent. We do not track children or show them targeted advertising.' },
    ],
    contact: 'Questions or complaints',
  },
  hi: {
    title: 'हम आपके डेटा का उपयोग कैसे करते हैं',
    intro: 'Tether आपकी जानकारी के साथ क्या करता है, यहाँ है। आप प्रोफ़ाइल → गोपनीयता और सहमति में कभी भी अपनी पसंद बदल सकते हैं।',
    sections: [
      { h: 'हम क्या एकत्र करते हैं', b: 'नाम, मोबाइल नंबर, जन्मतिथि, UHID, अपॉइंटमेंट, जाँच रिपोर्ट, पर्चे, बिल, और आपकी विज़िट व भर्ती के रिकॉर्ड।' },
      { h: 'क्यों', b: 'आपको इलाज देने और इस ऐप में उसे देखने व संभालने के लिए। वैकल्पिक उपयोग तभी होते हैं जब आप उन्हें चालू करें।' },
      { h: 'कौन देख सकता है', b: 'आपके इलाज करने वाले डॉक्टर और अधिकृत अस्पताल कर्मचारी। परिवार के सदस्य तभी जब आप उन्हें अनुमति दें। हम आपका डेटा बेचते नहीं हैं।' },
      { h: 'कितने समय तक रखते हैं', b: 'चिकित्सा रिकॉर्ड कानून द्वारा आवश्यक अवधि तक रखे जाते हैं। अन्य डेटा आपके सहमति वापस लेने या मिटाने के अनुरोध पर हटा दिया जाता है, जब तक कानून रखने को न कहे।' },
      { h: 'आपके अधिकार', b: 'अपने डेटा की प्रति देखें, उसे सुधारें, मिटवाएँ, जितनी आसानी से सहमति दी उतनी आसानी से वापस लें, अपने लिए किसी को नामित करें, और हमें शिकायत करें। समाधान न होने पर आप भारतीय डेटा संरक्षण बोर्ड में शिकायत कर सकते हैं।' },
      { h: 'बच्चे', b: '18 वर्ष से कम आयु के लिए माता-पिता या कानूनी अभिभावक सहमति देते हैं। हम बच्चों को ट्रैक नहीं करते और उन्हें लक्षित विज्ञापन नहीं दिखाते।' },
    ],
    contact: 'प्रश्न या शिकायत',
  },
} as const;
