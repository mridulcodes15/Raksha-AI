import { useState, useEffect, useRef } from 'react';
import './App.css';
import rakshaLogo from './assets/raksha-logo.jpg';

// 10-15 Fake Scam Call Transcript templates containing schema fields:
// caller_claimed_identity, accusation_type, payment_destination_claim, and triggers
const SCAM_TEMPLATES = [
  {
    name: "CBI Drug Package (Digital Arrest)",
    id: "c_8821a",
    caller_claimed_identity: "CBI",
    accusation_type: "parcel_with_contraband",
    payment_destination_claim: "RBI escrow account",
    caller_number: "+91 92004-18293 (Spoofed)",
    receiver_id: "u_4471",
    dialogue: [
      { sender: "caller", text: "Hello, this is Officer Ajay Kumar from the CBI Headquarters in Mumbai. Am I speaking with the holder of Aadhaar card ending in 4471?", triggers: {} },
      { sender: "victim", text: "Yes, this is she. May I know what this is about?", triggers: {} },
      { sender: "caller", text: "Ma'am, we have intercepted a courier parcel sent from Taiwan to your address containing 5 fake passports, 150 grams of MDMA (drugs), and 12 credit cards.", triggers: { caller_claimed_identity: "CBI", accusation_type: "parcel_with_contraband" } },
      { sender: "victim", text: "What? No! I haven't ordered anything from Taiwan. This is a misunderstanding!", triggers: {} },
      { sender: "caller", text: "This is a serious case of drug trafficking. A warrant has been issued in your name. We are placing you under immediate digital arrest.", triggers: { accusation_type: "drug_trafficking", urgency_flag: true } },
      { sender: "caller", text: "Connect to our Skype video call immediately for online interrogation. I am showing you the official warrant and CBI ID card on screen.", triggers: { video_call_flag: true, fake_document_shown: true } },
      { sender: "victim", text: "Oh my god. I've never committed any crime. Please help me, what should I do?", triggers: {} },
      { sender: "caller", text: "You must lock yourself in a private room. Do not disconnect the call, and do not contact any family members. If you talk to anyone, we will consider you an accomplice.", triggers: { isolation_flag: true } },
      { sender: "victim", text: "Okay, okay, I'm in my room. I've locked the door. Please don't arrest me.", triggers: {} },
      { sender: "caller", text: "To verify that your bank accounts are not linked to this money laundering racket, you must temporarily transfer your balance to the secure RBI Escrow verification account.", triggers: { payment_destination_claim: "RBI escrow account" } },
      { sender: "caller", text: "Do this transfer within 10 minutes. If your money is clean, it will be automatically refunded to you once the audit is complete.", triggers: { urgency_flag: true } }
    ]
  },
  {
    name: "TRAI Aadhaar Misuse & Blockage",
    id: "c_9942b",
    caller_claimed_identity: "TRAI",
    accusation_type: "aadhaar_misuse",
    payment_destination_claim: "verification account",
    caller_number: "+91 80312-99042 (Spoofed)",
    receiver_id: "u_8841",
    dialogue: [
      { sender: "caller", text: "Greetings. This is the Telecom Regulatory Authority of India (TRAI). This call is to notify you that all mobile numbers registered under your Aadhaar will be deactivated within 2 hours.", triggers: { caller_claimed_identity: "TRAI", urgency_flag: true } },
      { sender: "victim", text: "Wait, what? Why are you deactivating my numbers? I only have one connection!", triggers: {} },
      { sender: "caller", text: "An illegal connection in Mumbai was registered with your Aadhaar, and it has been flagged for extortion calls and money laundering.", triggers: { accusation_type: "aadhaar_misuse" } },
      { sender: "victim", text: "I have never registered another SIM card! Someone must have stolen my identity.", triggers: {} },
      { sender: "caller", text: "You need to resolve this with the Cyber Police in Mumbai immediately. I will transfer your call to Deputy Inspector Deshmukh on a secure line.", triggers: {} },
      { sender: "caller", text: "This is Inspector Deshmukh. Since your credentials are implicated, you must make a formal statement in isolation. Keep this line open, do not hang up or tell your family.", triggers: { isolation_flag: true } },
      { sender: "victim", text: "I am ready to cooperate, please don't block my phone lines.", triggers: {} },
      { sender: "caller", text: "To clear your name, you must secure your savings into the government audit verification account. If the funds are clean, your lines will remain active.", triggers: { payment_destination_claim: "verification account" } }
    ]
  },
  {
    name: "Customs & ED Money Laundering",
    id: "c_5541e",
    caller_claimed_identity: "Customs",
    accusation_type: "money_laundering",
    payment_destination_claim: "verification account",
    caller_number: "+91 94432-11002 (Spoofed)",
    receiver_id: "u_1029",
    dialogue: [
      { sender: "caller", text: "Hello, this is the Customs Officer at Delhi Airport. A suspicious box containing $50,000 in undeclared cash has been held, and it lists you as the consignee.", triggers: { caller_claimed_identity: "Customs" } },
      { sender: "victim", text: "A box of cash? That's not mine! I don't know who sent that.", triggers: {} },
      { sender: "caller", text: "This is a direct violation of Foreign Exchange Management Act (FEMA). The Enforcement Directorate (ED) has been informed.", triggers: { accusation_type: "money_laundering", fake_document_shown: true } },
      { sender: "victim", text: "I swear I don't know anything about this! What can I do?", triggers: {} },
      { sender: "caller", text: "You must cooperate with the ED inspectors immediately over a secure video link. They will show you the seizure files and court order.", triggers: { video_call_flag: true, isolation_flag: true } },
      { sender: "caller", text: "You must remain isolated in your room during this process. If you talk to anyone, we will treat you as a co-conspirator who is escaping arrest.", triggers: { isolation_flag: true, urgency_flag: true } },
      { sender: "victim", text: "I can't go to jail. Please guide me.", triggers: {} },
      { sender: "caller", text: "You need to deposit the equivalent bail amount in the Customs verification account to verify your identity. If clean, we will cancel the warrant.", triggers: { payment_destination_claim: "verification account" } }
    ]
  }
];

// Multi-language advisory alerts and checklist guidance (7 Indian languages)
const LOCALIZED_CONTENT = {
  en: {
    advisoryTitle: "Cyber Safety Advisory",
    alertVerdict: "CRITICAL ALERT: SCAM DETECTED",
    hangupAction: "1. Hang Up Immediately",
    hangupDesc: "Disconnect from the call. Official departments do not conduct investigations on WhatsApp or Skype.",
    blockAction: "2. Block and Report Number",
    blockDesc: "Mark the caller number as spam in your phone app and WhatsApp.",
    ncrbAction: "3. File NCRB Complaint",
    ncrbDesc: "Report the fraud attempt to the National Cyber Crime Reporting Portal.",
    officialWarning: "Remember: CBI, Police, ED, or Customs will NEVER place you under 'digital arrest' or demand funds for verification.",
    ncrbButton: "Report to NCRB",
    activeLabel: "Shield Active",
    probLabel: "SCAM PROBABILITY",
    leadTimeLabel: "Estimated Response Window (lead_time_sec)"
  },
  hi: {
    advisoryTitle: "साइबर सुरक्षा सलाह",
    alertVerdict: "गंभीर चेतावनी: घोटाला पकड़ा गया",
    hangupAction: "1. तुरंत फोन काटें",
    hangupDesc: "कॉल काट दें। सरकारी विभाग व्हाट्सएप या स्काइप पर जांच नहीं करते हैं।",
    blockAction: "2. नंबर ब्लॉक करें",
    blockDesc: "कॉल करने वाले नंबर को अपने फोन और व्हाट्सएप पर स्पैम मार्क करें।",
    ncrbAction: "3. एनसीआरबी शिकायत दर्ज करें",
    ncrbDesc: "राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल पर धोखाधड़ी के प्रयास की रिपोर्ट करें।",
    officialWarning: "याद रखें: सीबीआई, पुलिस, ईडी या सीमा शुल्क विभाग कभी भी आपको 'डिजिटल अरेस्ट' में नहीं रखेंगे और न ही सत्यापन के लिए पैसे मांगेंगे।",
    ncrbButton: "एनसीआरबी को रिपोर्ट करें",
    activeLabel: "शील्ड सक्रिय है",
    probLabel: "घोटाले की संभावना",
    leadTimeLabel: "अनुमानित प्रतिक्रिया समय (lead_time_sec)"
  },
  kn: {
    advisoryTitle: "ಸೈಬರ್ ಸುರಕ್ಷತಾ ಸಲಹೆ",
    alertVerdict: "ನಿರ್ಣಾಯಕ ಎಚ್ಚರಿಕೆ: ವಂಚನೆ ಪತ್ತೆಯಾಗಿದೆ",
    hangupAction: "1. ತಕ್ಷಣ ಕರೆ ಕಡಿತಗೊಳಿಸಿ",
    hangupDesc: "ಕರೆಯನ್ನು ಸ್ಥಗಿತಗೊಳಿಸಿ. ಸರ್ಕಾರಿ ಇಲಾಖೆಗಳು ವಾಟ್ಸಾಪ್ ಅಥವಾ ಸ್ಕೈಪ್‌ನಲ್ಲಿ ತನಿಖೆ ನಡೆಸುವುದಿಲ್ಲ.",
    blockAction: "2. ಸಂಖ್ಯೆಯನ್ನು ಬ್ಲಾಕ್ ಮಾಡಿ",
    blockDesc: "ನಿಮ್ಮ ಫೋನ್ ಮತ್ತು ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಕಾಲರ್ ಸಂಖ್ಯೆಯನ್ನು ಸ್ಪ್ಯಾಮ್ ಎಂದು ಗುರುತಿಸಿ.",
    ncrbAction: "3. ಎನ್‌ಸಿಆರ್‌ಬಿ ದೂರು ಸಲ್ಲಿಸಿ",
    ncrbDesc: "ರಾಷ್ಟ್ರೀಯ ಸೈಬర్ ಅಪರಾಧ ವರದಿ ಪೋರ್ಟಲ್‌ಗೆ ವಂಚನೆ ಯತ್ನವನ್ನು ವರದಿ ಮಾಡಿ.",
    officialWarning: "ನೆನಪಿಡಿ: ಸಿಬಿಐ, ಪೊಲೀಸ್, ಇಡಿ ಅಥವಾ ಕಸ್ಟಮ್ಸ್ ಇಲಾಖೆಯು ನಿಮ್ಮನ್ನು ಎಂದಿಗೂ 'ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್' ಮಾಡುವುದಿಲ್ಲ ಮತ್ತು ಪರಿಶೀಲನೆಗಾಗಿ ಹಣವನ್ನು ಕೇಳುವುದಿಲ್ಲ.",
    ncrbButton: "ಎನ್‌ಸಿಆರ್‌ಬಿಗೆ ವರದಿ ಮಾಡಿ",
    activeLabel: "ಶೀಲ್ಡ್ ಸಕ್ರಿಯವಾಗಿದೆ",
    probLabel: "ವಂಚನೆಯ ಸಾಧ್ಯತೆ",
    leadTimeLabel: "ಅಂದಾಜು ಪ್ರತಿಕ್ರಿಯೆ ಸಮಯ (lead_time_sec)"
  },
  ta: {
    advisoryTitle: "사이เบอร์ 안전 자문",
    alertVerdict: "முக்கிய எச்சரிக்கை: மோசடி கண்டறியப்பட்டது",
    hangupAction: "1. உடனடியாக அழைப்பைத் துண்டிக்கவும்",
    hangupDesc: "அழைப்பைத் துண்டிக்கவும். அரசுத் துறைகள் வாட்ஸ்அப் அல்லது ஸ்கைப் மூலம் விசாரணை நடத்துவதில்லை.",
    blockAction: "2. எண்ணை பிளாக் செய்யவும்",
    blockDesc: "அழைப்பாளர் எண்ணை உங்கள் போன் மற்றும் வாட்ஸ்அப்பில் ஸ்பேம் என குறியிடவும்.",
    ncrbAction: "3. என்சிஆர்பி புகார் அளிக்கவும்",
    ncrbDesc: "தேசிய சைபர் குற்றப் புகாரளிப்பு போர்ட்டலில் மோசடி முயற்சியைப் புகாரளிக்கவும்.",
    officialWarning: "நினைவில் கொள்க: சிபிஐ, போலீஸ், இடி அல்லது சுங்கத்துறை உங்களை ஒருபோதும் 'டிஜிட்டல் கைது' செய்யாது மற்றும் சரிபார்ப்புக்காக பணம் கேட்காது.",
    ncrbButton: "என்சிஆர்பிக்கு புகார் செய்",
    activeLabel: "கேடயம் செயலில் உள்ளது",
    probLabel: "மோசடி நிகழ்தகவு",
    leadTimeLabel: "மதிப்பிடப்பட்ட பதில் நேரம் (lead_time_sec)"
  },
  te: {
    advisoryTitle: "సైబర్ భద్రతా సలహా",
    alertVerdict: "తీవ్ర హెచ్చరిక: మోసం కనుగొనబడింది",
    hangupAction: "1. వెంటనే కాల్ కట్ చేయండి",
    hangupDesc: "కాల్ కట్ చేయండి. ప్రభుత్వ విభాగాలు వాట్సాప్ లేదా స్కైప్‌లో విచారణ జరపవు.",
    blockAction: "2. నంబర్ బ్లాక్ చేయండి",
    blockDesc: "మీ ఫోన్ మరియు వాట్సాప్‌లో కాలర్ నంబర్‌ను స్పామ్‌గా మార్క్ చేయండి.",
    ncrbAction: "3. ఎన్‌సీఆర్‌బీ ఫిర్యాదు చేయండి",
    ncrbDesc: "నేషనల్ సైబర్ క్రైమ్ రిపోర్టింగ్ పోర్టల్‌కు మోసం ప్రయత్నాన్ని నివేదించండి.",
    officialWarning: "గుర్తుంచుకోండి: సిబిఐ, పోలీస్, ఈడీ లేదా కస్టమ్స్ మిమ్మల్ని ఎప్పుడూ 'డిజిటల్ అరెస్ట్' చేయవు మరియు వెరిఫికేషన్ కోసం డబ్బులు అడగవు.",
    ncrbButton: "ఎన్‌సీఆర్‌బీకి రిపోర్ట్ చేయండి",
    activeLabel: "షీల్డ్ యాక్టివ్‌గా ఉంది",
    probLabel: "మోసం సంభావ్యత",
    leadTimeLabel: "అంచనా స్పందన సమయం (lead_time_sec)"
  },
  mr: {
    advisoryTitle: "सायबर सुरक्षा सल्ला",
    alertVerdict: "गंभीर इशारा: फसवणूक आढळली",
    hangupAction: "1. त्वरित कॉल कट करा",
    hangupDesc: "कॉल कट करा. सरकारी विभाग व्हॉट्सॲप किंवा स्काईपवर चौकशी करत नाहीत.",
    blockAction: "2. नंबर BLOCK करा",
    blockDesc: "कॉल करणाऱ्या नंबरला तुमच्या फोनमध्ये आणि व्हॉट्सॲपवर स्पॅम म्हणून नोंदवा.",
    ncrbAction: "3. एनसीआरबी तक्रार नोंदवा",
    ncrbDesc: "राष्ट्रीय सायबर गुन्हे नोंदणी पोर्टलवर फसवणुकीच्या प्रयत्नाची तक्रार करा.",
    officialWarning: "लक्षात ठेवा: सीबीआय, पोलीस, ईडी किंवा कस्टम्स तुम्हाला कधीही 'डिजिटल अटक' मध्ये ठेवणार नाहीत आणि पडताळणीसाठी पैशांची मागणी करणार नाहीत.",
    ncrbButton: "एनसीआरबी कडे तक्रार करा",
    activeLabel: "शील्ड सक्रिय आहे",
    probLabel: "फसवणुकीची शक्यता",
    leadTimeLabel: "अंदाजे प्रतिसाद वेळ (lead_time_sec)"
  },
  bn: {
    advisoryTitle: "সাইবার নিরাপত্তা পরামর্শ",
    alertVerdict: "জরুরী সতর্কতা: প্রতারণা সনাক্ত হয়েছে",
    hangupAction: "1. অবিলম্বে কল কেটে দিন",
    hangupDesc: "কল কেটে দিন। সরকারি দপ্তরগুলি হোয়াটসঅ্যাপ বা স্কাইপে তদন্ত পরিচালনা করে না।",
    blockAction: "2. নম্বর ব্লক করুন",
    blockDesc: "আপনার ফোন এবং হোয়াটসঅ্যাপে কলার নম্বরটি স্প্যাম হিসেবে চিহ্নিত করুন।",
    ncrbAction: "3. এনসিআরবি অভিযোগ দায়ের করুন",
    ncrbDesc: "জাতীয় সাইবার অপরাধ রিপোর্টিং পোর্টালে প্রতারণার চেষ্টার রিপোর্ট করুন।",
    officialWarning: "মনে রাখবেন: সিবিআই, পুলিশ, ইডি বা কাস্টমস কখনই আপনাকে 'ডিজিটাল গ্রেপ্তার' করবে না এবং যাচাইয়ের জন্য টাকা দাবি করবে না।",
    ncrbButton: "এনসিআরবি রিপোর্ট করুন",
    activeLabel: "শিল্ড সক্রিয় আছে",
    probLabel: "প্রতারণার সম্ভাবনা",
    leadTimeLabel: "আনুমানিক প্রতিক্রিয়া সময় (lead_time_sec)"
  }
};

function App() {
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Phase 3 states
  const [customInput, setCustomInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportDetails, setReportDetails] = useState({
    callerNumber: "",
    impersonatedIdentity: "",
    accusationType: "",
    incidentDescription: "",
    includeLogs: true
  });

  // Real-time schema state variables
  const [callerClaimedIdentity, setCallerClaimedIdentity] = useState("Not Detected");
  const [accusationType, setAccusationType] = useState("Not Detected");
  const [paymentDestinationClaim, setPaymentDestinationClaim] = useState("Not Detected");
  const [flags, setFlags] = useState({
    fake_document_shown: false,
    video_call_flag: false,
    isolation_flag: false,
    urgency_flag: false,
  });

  const [scamProbability, setScamProbability] = useState(0.05);
  const [leadTimeSec, setLeadTimeSec] = useState(0);

  const chatEndRef = useRef(null);
  const simulationIntervalRef = useRef(null);

  const activeTemplate = SCAM_TEMPLATES[selectedTemplateIndex];

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Lead time countdown timer simulation
  useEffect(() => {
    let timer = null;
    if (leadTimeSec > 0) {
      timer = setInterval(() => {
        setLeadTimeSec(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [leadTimeSec]);

  // Clean simulation intervals on unmount
  useEffect(() => {
    return () => stopSimulation();
  }, []);

  // Compute Scam Probability based on accumulated triggers and details
  const updateScamProbability = (currentFlags, identity, accusation, payment) => {
    let score = 0.05; // Base probability

    if (identity !== "Not Detected") score += 0.15;
    if (accusation !== "Not Detected") score += 0.20;
    if (payment !== "Not Detected") score += 0.15;

    if (currentFlags.urgency_flag) score += 0.15;
    if (currentFlags.isolation_flag) score += 0.15;
    if (currentFlags.video_call_flag) score += 0.10;
    if (currentFlags.fake_document_shown) score += 0.10;

    // Cap at 0.98 for realistic classifier peak
    const finalScore = Math.min(score, 0.98);
    setScamProbability(finalScore);
  };

  // Phase 3: Token NLP live classifier engine run on any transcript input
  const runLiveClassifier = (text, currentFlags, identity, accusation, payment) => {
    const lowerText = text.toLowerCase();
    let newIdentity = identity;
    let newAccusation = accusation;
    let newPayment = payment;
    let newFlags = { ...currentFlags };

    // Identity Checks
    if (lowerText.includes("cbi") || lowerText.includes("central bureau of investigation")) {
      newIdentity = "CBI";
    } else if (lowerText.includes("ed ") || lowerText.includes("enforcement directorate")) {
      newIdentity = "ED";
    } else if (lowerText.includes("customs") || lowerText.includes("airport authority")) {
      newIdentity = "Customs";
    } else if (lowerText.includes("rbi") || lowerText.includes("reserve bank")) {
      newIdentity = "RBI";
    } else if (lowerText.includes("police") || lowerText.includes("cyber cell") || lowerText.includes("dcp") || lowerText.includes("inspector")) {
      newIdentity = "Mumbai Police";
    } else if (lowerText.includes("trai") || lowerText.includes("telecom regulatory")) {
      newIdentity = "TRAI";
    }

    // Accusation Domain Checks
    if (lowerText.includes("laundering") || lowerText.includes("black money") || lowerText.includes("extortion")) {
      newAccusation = "money_laundering";
    } else if (lowerText.includes("drug") || lowerText.includes("mdma") || lowerText.includes("narcotics") || lowerText.includes("contraband") || lowerText.includes("trafficking")) {
      newAccusation = "drug_trafficking";
    } else if (lowerText.includes("parcel") || lowerText.includes("package") || lowerText.includes("fedex") || lowerText.includes("courier") || lowerText.includes("consignment")) {
      newAccusation = "parcel_with_contraband";
    } else if (lowerText.includes("aadhaar") || lowerText.includes("identity theft") || lowerText.includes("sim card") || lowerText.includes("mobile numbers") || lowerText.includes("sims")) {
      newAccusation = "aadhaar_misuse";
    }

    // Escrow Transfer Claims
    if (lowerText.includes("escrow") || lowerText.includes("rbi account") || lowerText.includes("escrow account")) {
      newPayment = "RBI escrow account";
    } else if (lowerText.includes("verification") || lowerText.includes("audit") || lowerText.includes("verify") || lowerText.includes("government account")) {
      newPayment = "verification account";
    }

    // Behavioral Flags
    if (lowerText.includes("isolate") || lowerText.includes("private room") || lowerText.includes("closed room") || lowerText.includes("alone") || lowerText.includes("don't tell") || lowerText.includes("do not tell") || lowerText.includes("family") || lowerText.includes("hang up") || lowerText.includes("disconnect") || lowerText.includes("leak")) {
      newFlags.isolation_flag = true;
    }
    if (lowerText.includes("immediate") || lowerText.includes("minutes") || lowerText.includes("hours") || lowerText.includes("now") || lowerText.includes("warrant") || lowerText.includes("arrest") || lowerText.includes("jail") || lowerText.includes("prison") || lowerText.includes("extortion")) {
      newFlags.urgency_flag = true;
    }
    if (lowerText.includes("video") || lowerText.includes("skype") || lowerText.includes("camera") || lowerText.includes("whatsapp call")) {
      newFlags.video_call_flag = true;
    }
    if (lowerText.includes("warrant") || lowerText.includes("court order") || lowerText.includes("id card") || lowerText.includes("badge") || lowerText.includes("document") || lowerText.includes("fir") || lowerText.includes("order")) {
      newFlags.fake_document_shown = true;
    }

    setCallerClaimedIdentity(newIdentity);
    setAccusationType(newAccusation);
    setPaymentDestinationClaim(newPayment);
    setFlags(newFlags);

    // Trigger Response lead time timer if urgency is detected
    if (newFlags.urgency_flag && leadTimeSec === 0) {
      setLeadTimeSec(480); // 8 minutes
    }

    updateScamProbability(newFlags, newIdentity, newAccusation, newPayment);
  };

  const handleTemplateChange = (e) => {
    const idx = parseInt(e.target.value);
    setSelectedTemplateIndex(idx);
    resetSimulation(idx);
  };

  const resetSimulation = (templateIdx = selectedTemplateIndex) => {
    stopSimulation();
    setCurrentLine(0);
    setChatHistory([]);
    setCallerClaimedIdentity("Not Detected");
    setAccusationType("Not Detected");
    setPaymentDestinationClaim("Not Detected");
    setFlags({
      fake_document_shown: false,
      video_call_flag: false,
      isolation_flag: false,
      urgency_flag: false,
    });
    setScamProbability(0.05);
    setLeadTimeSec(0);
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulating(false);
  };

  const triggerToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const formatLeadTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const stepForward = (templateIdx = selectedTemplateIndex) => {
    const template = SCAM_TEMPLATES[templateIdx];
    if (currentLine >= template.dialogue.length) {
      stopSimulation();
      return;
    }

    const nextLineObj = template.dialogue[currentLine];
    const timestamp = new Date().toISOString();

    // Add to chat history
    setChatHistory(prev => [...prev, {
      sender: nextLineObj.sender,
      text: nextLineObj.text,
      timestamp
    }]);

    // Feed template dialogue directly into classifier to simulate AI NLP extraction
    runLiveClassifier(nextLineObj.text, flags, callerClaimedIdentity, accusationType, paymentDestinationClaim);
    setCurrentLine(prev => prev + 1);
  };

  const startAutoSimulation = () => {
    if (currentLine >= activeTemplate.dialogue.length) {
      resetSimulation();
    }
    setIsSimulating(true);

    // Process first step immediately
    stepForward();

    simulationIntervalRef.current = setInterval(() => {
      setCurrentLine(prev => {
        if (prev >= activeTemplate.dialogue.length) {
          clearInterval(simulationIntervalRef.current);
          setIsSimulating(false);
          return prev;
        }
        stepForward();
        return prev;
      });
    }, 2000);
  };

  // Submission handler for custom text input (Red-Team testing)
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const timestamp = new Date().toISOString();

    // Show the message in chat
    setChatHistory((prev) => [
      ...prev,
      {
        sender: "caller",
        text: customInput,
        timestamp,
      },
    ]);

    // Run local classifier
    runLiveClassifier(
      customInput,
      flags,
      callerClaimedIdentity,
      accusationType,
      paymentDestinationClaim
    );

    // Send data to your Render backend
    try {
      const callData = {
        transcript: customInput,
      };

      const res = await fetch("https://raksha-ai-v7j9.onrender.com/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(callData),
      });

      const result = await res.json();
      console.log("Backend Response:", result);

      // (Optional) If your backend returns scam probability
      if (result.scam_probability) {
        setScamProbability(result.scam_probability);
      }

      triggerToast("Analysis completed successfully.");
    } catch (error) {
      console.error("Backend Error:", error);
      triggerToast("Unable to connect to backend.");
    }

    setCustomInput("");
  };

  // NCRB Guided Wizard Controls
  const openReportWizard = () => {
    setReportDetails({
      callerNumber: activeTemplate.caller_number,
      impersonatedIdentity: callerClaimedIdentity !== "Not Detected" ? callerClaimedIdentity : "Unknown Department",
      accusationType: accusationType !== "Not Detected" ? accusationType : "Identity Theft",
      incidentDescription: `Impersonator claiming to be ${callerClaimedIdentity !== "Not Detected" ? callerClaimedIdentity : "Unknown authority"} made an extortion call, accusing me of ${accusationType !== "Not Detected" ? accusationType.replace(/_/g, ' ') : "Aadhaar misuse"}. Demanded funds be sent to a verification/escrow account: ${paymentDestinationClaim !== "Not Detected" ? paymentDestinationClaim : "Not specified"}. Isolated me on Skype/video call.`,
      includeLogs: true
    });
    setModalStep(1);
    setIsReportModalOpen(true);
  };

  const handleModalNext = () => {
    if (modalStep === 1) {
      setModalStep(2);
    } else if (modalStep === 2) {
      setIsSubmittingReport(true);
      setTimeout(() => {
        setIsSubmittingReport(false);
        setModalStep(3);
        triggerToast("Complaint filed successfully on cybercrime.gov.in mock gateway.");
      }, 1500);
    }
  };

  const handleModalPrev = () => {
    if (modalStep > 1) {
      setModalStep(prev => prev - 1);
    }
  };

  // Compile key triggers array
  const keyTriggers = [];
  if (flags.isolation_flag) keyTriggers.push("isolation_flag");
  if (flags.urgency_flag) keyTriggers.push("urgency_flag");
  if (flags.video_call_flag) keyTriggers.push("video_call_flag");
  if (flags.fake_document_shown) keyTriggers.push("fake_document_shown");

  // Build the live evidence package object matching schema output
  const evidencePackage = {
    session_id: activeTemplate.id,
    call_metadata: {
      call_id: activeTemplate.id,
      caller_number: activeTemplate.caller_number,
      receiver_id: activeTemplate.receiver_id,
      call_timestamp: new Date().toISOString().split('T')[0] + "T10:32:00Z",
      call_duration_sec: currentLine * 15,
    },
    extracted_features: {
      caller_claimed_identity: callerClaimedIdentity,
      accusation_type: accusationType,
      payment_destination_claim: paymentDestinationClaim,
      flags
    },
    prediction: {
      scam_probability: parseFloat(scamProbability.toFixed(2)),
      key_triggers: keyTriggers,
      lead_time_sec: leadTimeSec,
      legal_admissibility_score: scamProbability > 0.7 ? "HIGH" : "LOW"
    }
  };

  // Get Risk Assessment Text based on probability
  const getRiskStatus = () => {
    if (scamProbability < 0.3) {
      return { label: "Low Risk", color: "var(--accent-green)", desc: "Normal conversational patterns. Shield is monitoring active line." };
    } else if (scamProbability < 0.7) {
      return { label: "Suspicious", color: "var(--accent-yellow)", desc: "Potential impersonation and isolation tactics detected. Exercise extreme caution." };
    } else {
      return { label: "Critical Threat", color: "var(--accent-red)", desc: "DIGITAL ARREST SCAM CONFIRMED. Impersonator threatening legal action. Disconnect call immediately." };
    }
  };

  const riskStatus = getRiskStatus();

  // Circle progress math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scamProbability * circumference);

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--accent-blue)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          color: '#fff',
          zIndex: 1200,
          boxShadow: '0 4px 20px rgba(0, 210, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          animation: 'slide-in 0.3s ease-out'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-blue)' }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Guided Reporting Modal (NCRB Complaint Wizard) */}
      {isReportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                National Cyber Crime (NCRB) Reporting Wizard
              </h3>
              <button className="modal-close-btn" onClick={() => setIsReportModalOpen(false)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {/* Progress Steps */}
              <div className="step-indicator">
                <div className={`step-node ${modalStep >= 1 ? (modalStep > 1 ? 'completed' : 'active') : ''}`}>
                  {modalStep > 1 ? "✓" : "1"}
                </div>
                <div className={`step-node ${modalStep >= 2 ? (modalStep > 2 ? 'completed' : 'active') : ''}`}>
                  {modalStep > 2 ? "✓" : "2"}
                </div>
                <div className={`step-node ${modalStep === 3 ? 'completed active' : ''}`}>
                  3
                </div>
              </div>

              {/* Step Content */}
              {modalStep === 1 && (
                <div className="step-pane">
                  <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Verify the scam specifics auto-extracted by the Citizen Fraud Shield sensor.
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <span className="form-label">Caller Phone (Origin)</span>
                      <input
                        type="text"
                        className="form-input"
                        value={reportDetails.callerNumber}
                        onChange={(e) => setReportDetails({ ...reportDetails, callerNumber: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <span className="form-label">Anonymized Receiver ID</span>
                      <input type="text" className="form-input" value={activeTemplate.receiver_id} disabled />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <span className="form-label">Claimed Impersonation</span>
                      <input
                        type="text"
                        className="form-input"
                        value={reportDetails.impersonatedIdentity}
                        onChange={(e) => setReportDetails({ ...reportDetails, impersonatedIdentity: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <span className="form-label">Crime Accusation Claim</span>
                      <input
                        type="text"
                        className="form-input"
                        value={reportDetails.accusationType.replace(/_/g, ' ')}
                        onChange={(e) => setReportDetails({ ...reportDetails, accusationType: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Incident Description Summary</span>
                    <textarea
                      className="form-textarea"
                      value={reportDetails.incidentDescription}
                      onChange={(e) => setReportDetails({ ...reportDetails, incidentDescription: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {modalStep === 2 && (
                <div className="step-pane">
                  <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Confirm the digital evidence package details to attach to the official filing.
                  </div>
                  <div className="form-group">
                    <span className="form-label">Extracted Call Transcription Snapshot</span>
                    <div style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.4'
                    }}>
                      {chatHistory.map((h, i) => (
                        <div key={i} style={{ marginBottom: '4px' }}>
                          <strong style={{ color: h.sender === 'caller' ? 'var(--accent-red)' : 'var(--accent-blue)' }}>
                            {h.sender === 'caller' ? 'Caller: ' : 'You: '}
                          </strong>
                          {h.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '20px' }}>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={reportDetails.includeLogs}
                        onChange={(e) => setReportDetails({ ...reportDetails, includeLogs: e.target.checked })}
                      />
                      <span>Attach cryptographic evidence package JSON (Includes schema keys, probability metrics, and trigger logs for auditability)</span>
                    </label>
                  </div>

                  {isSubmittingReport && (
                    <div>
                      <div className="spinner"></div>
                      <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--accent-blue)' }}>
                        Uploading evidence to cybercrime.gov.in gateway...
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalStep === 3 && (
                <div className="step-pane">
                  <div className="success-receipt">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h4>Complaint Filed Successfully</h4>
                    <span className="receipt-number">NCRB-ACK-{activeTemplate.id.toUpperCase()}-2026</span>
                    <div className="receipt-details">
                      Your cyber incident report has been submitted to the National Cyber Crime Portal.
                      Impersonator number <strong>{activeTemplate.caller_number}</strong> and the associated evidence package
                      have been registered for immediate block action under the telecom registry.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {modalStep < 3 ? (
                <>
                  <button
                    className="btn-secondary"
                    onClick={handleModalPrev}
                    disabled={modalStep === 1 || isSubmittingReport}
                  >
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleModalNext}
                    disabled={isSubmittingReport}
                  >
                    {modalStep === 2 ? "File Complaint" : "Next"}
                  </button>
                </>
              ) : (
                <button
                  className="btn-primary"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => setIsReportModalOpen(false)}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <header className="app-header">
        <div className="logo-section">
          <img
            src={rakshaLogo}
            alt="Raksha AI - Citizen Fraud Shield"
            className="raksha-logo-img"
          />
          <h1>CITIZEN FRAUD SHIELD</h1>
          <div className="shield-badge">
            <div className="shield-pulse-dot"></div>
            <span>{LOCALIZED_CONTENT[selectedLanguage].activeLabel}</span>
          </div>
        </div>

        <div className="header-right">
          {/* Language Selector */}
          <select
            aria-label="Select language"
            className="lang-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="bn">বাংলা (Bengali)</option>
          </select>

          <div className="meta-stats">
            <div className="stat-item">
              <span>Session:</span>
              <span>{activeTemplate.id}</span>
            </div>
            <div className="stat-item">
              <span>Origin:</span>
              <span>{activeTemplate.caller_number}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="dashboard-grid">
        {/* Left Pane - Speech-to-Text Simulator */}
        <section className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              <h2>Speech-to-Text Simulator</h2>
            </div>
            <div className="transcript-actions">
              <select
                className="template-selector"
                value={selectedTemplateIndex}
                onChange={handleTemplateChange}
                disabled={isSimulating}
              >
                {SCAM_TEMPLATES.map((tmpl, idx) => (
                  <option key={tmpl.id} value={idx}>{tmpl.name}</option>
                ))}
              </select>
              <button className="btn-secondary" onClick={() => resetSimulation()}>Reset</button>
            </div>
          </div>

          {/* Transcript Feed */}
          <div className="transcript-body">
            {chatHistory.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p>Awaiting live telecom stream connection...<br />Select a template above and click "Auto-Simulate" or "Step Line".</p>
              </div>
            ) : (
              chatHistory.map((chat, idx) => (
                <div key={idx} className={`chat-bubble ${chat.sender}`}>
                  <div className="bubble-meta">
                    <span>{chat.sender === 'caller' ? `🚨 impersonator (${callerClaimedIdentity})` : '👤 citizen'}</span>
                    <span className="bubble-time">{new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <div className="bubble-text">{chat.text}</div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Simulator Actions */}
          <footer className="transcript-footer">
            {/* Custom Input Form (Phase 3 Red-Team testing input) */}
            <form onSubmit={handleCustomSubmit} className="custom-chat-form">
              <input
                id="custom-caller-line"
                aria-label="Type a custom caller line"
                type="text"
                className="custom-chat-input"
                placeholder="Type a custom caller line (e.g. 'This is CBI police, you are under digital arrest. Keep it secret.') to test classifier..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ padding: '10px 18px' }}>Send</button>
            </form>

            <div className="footer-buttons-row">
              <div className="transcription-feed-indicator">
                <div className="pulse-circle" style={{ backgroundColor: isSimulating ? 'var(--accent-red)' : 'var(--accent-green)' }}></div>
                <span>{isSimulating ? "FEED STATUS: SIMULATING STREAM" : "FEED STATUS: STANDBY"}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn-secondary"
                  onClick={() => stepForward()}
                  disabled={isSimulating || currentLine >= activeTemplate.dialogue.length}
                >
                  Step Line
                </button>
                <button
                  className="btn-primary"
                  onClick={isSimulating ? stopSimulation : startAutoSimulation}
                >
                  {isSimulating ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                      </svg>
                      Pause Sim
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      Auto-Simulate
                    </>
                  )}
                </button>
              </div>
            </div>
          </footer>
        </section>

        {/* Right Pane - Threat & Scam Analysis Hub */}
        <section className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              <h2>Threat Analysis Hub</h2>
            </div>
            <span className="panel-subtitle">Output Schema Real-time Engine</span>
          </div>

          <div className="analytics-body">
            {/* Dynamic Verdict Header based on Scam Probability */}
            {scamProbability >= 0.7 && (
              <div className="verdict-card threat">
                <div className="verdict-header">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span className="verdict-title">{LOCALIZED_CONTENT[selectedLanguage].alertVerdict}</span>
                </div>
                <div className="verdict-actions-list">
                  <div className="verdict-action-item">
                    <span className="verdict-action-title" style={{ color: 'var(--accent-red)' }}>
                      {LOCALIZED_CONTENT[selectedLanguage].hangupAction}
                    </span>
                    <span className="verdict-action-desc">{LOCALIZED_CONTENT[selectedLanguage].hangupDesc}</span>
                  </div>
                  <div className="verdict-action-item">
                    <span className="verdict-action-title" style={{ color: 'var(--accent-yellow)' }}>
                      {LOCALIZED_CONTENT[selectedLanguage].blockAction}
                    </span>
                    <span className="verdict-action-desc">{LOCALIZED_CONTENT[selectedLanguage].blockDesc}</span>
                  </div>
                  <div className="verdict-action-item">
                    <span className="verdict-action-title" style={{ color: 'var(--accent-blue)' }}>
                      {LOCALIZED_CONTENT[selectedLanguage].ncrbAction}
                    </span>
                    <span className="verdict-action-desc">{LOCALIZED_CONTENT[selectedLanguage].ncrbDesc}</span>
                  </div>
                </div>
                <div className="verdict-footer-warning">
                  {LOCALIZED_CONTENT[selectedLanguage].officialWarning}
                </div>
              </div>
            )}

            {scamProbability >= 0.3 && scamProbability < 0.7 && (
              <div className="verdict-card caution">
                <div className="verdict-header">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span className="verdict-title">SUSPICIOUS CALL PATTERN DETECTED</span>
                </div>
                <div className="verdict-actions-list">
                  <div className="verdict-action-item">
                    <span className="verdict-action-title">Verify Caller Identity</span>
                    <span className="verdict-action-desc">Impersonation tactics observed. Do not share OTPs, personal documents, or log into video rooms.</span>
                  </div>
                </div>
              </div>
            )}

            {/* 1. scam_probability circular dial widget */}
            <div className="risk-meter-container">
              <div className="risk-meter-gauge">
                <svg width="120" height="120">
                  <circle className="circular-bg" cx="60" cy="60" r={radius} />
                  <circle
                    className="circular-progress"
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke={riskStatus.color}
                    style={{ strokeDashoffset }}
                  />
                </svg>
                <div className="gauge-center-text">
                  <span className="gauge-percentage" style={{ color: riskStatus.color }}>
                    {Math.round(scamProbability * 100)}%
                  </span>
                  <span className="gauge-label">SCAM PROB</span>
                </div>
              </div>
              <div className="risk-details">
                <div className="risk-title" style={{ color: riskStatus.color }}>
                  {riskStatus.label}
                </div>
                <div className="risk-desc">{riskStatus.desc}</div>
              </div>
            </div>

            {/* 2. key_triggers list representation */}
            <div className="triggers-container">
              <span className="section-label">Scam Indicators (key_triggers)</span>
              <div className="triggers-grid">
                <div className={`trigger-card ${flags.isolation_flag ? 'active' : ''}`}>
                  <div className="trigger-icon-container">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div className="trigger-info">
                    <span className="trigger-name">Digital Isolation</span>
                    <span className="trigger-status">{flags.isolation_flag ? "Fired" : "Inactive"}</span>
                  </div>
                </div>

                <div className={`trigger-card ${flags.urgency_flag ? 'active' : ''}`}>
                  <div className="trigger-icon-container">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <div className="trigger-info">
                    <span className="trigger-name">Urgent Pressure</span>
                    <span className="trigger-status">{flags.urgency_flag ? "Fired" : "Inactive"}</span>
                  </div>
                </div>

                <div className={`trigger-card ${flags.video_call_flag || flags.fake_document_shown ? 'active' : ''}`}>
                  <div className="trigger-icon-container">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 7l-7 5 7 5V7z"></path>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                  </div>
                  <div className="trigger-info">
                    <span className="trigger-name">Visual Interrogation</span>
                    <span className="trigger-status">{(flags.video_call_flag || flags.fake_document_shown) ? "Fired" : "Inactive"}</span>
                  </div>
                </div>

                <div className={`trigger-card ${paymentDestinationClaim !== "Not Detected" ? 'active' : ''}`}>
                  <div className="trigger-icon-container">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div className="trigger-info">
                    <span className="trigger-name">Escrow Transfer</span>
                    <span className="trigger-status">{paymentDestinationClaim !== "Not Detected" ? "Fired" : "Inactive"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. lead_time_sec countdown banner */}
            <div className="stats-subgrid">
              <div className={`lead-time-banner ${leadTimeSec > 0 ? 'alert-active' : ''}`}>
                <div className="lead-time-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="lead-time-info">
                  <span className="lead-time-title">{LOCALIZED_CONTENT[selectedLanguage].leadTimeLabel}</span>
                  <span className="lead-time-value">{formatLeadTime(leadTimeSec)}</span>
                </div>
              </div>

              {/* Identity & Accusation Schema fields */}
              <div className="context-metadata-grid">
                <div className={`metadata-card ${callerClaimedIdentity === "Not Detected" ? "empty" : ""}`}>
                  <span className="metadata-label">Claimed Identity</span>
                  <span className="metadata-value">{callerClaimedIdentity}</span>
                </div>
                <div className={`metadata-card ${accusationType === "Not Detected" ? "empty" : ""}`}>
                  <span className="metadata-label">Accusation Type</span>
                  <span className="metadata-value" style={{ textTransform: 'capitalize' }}>
                    {accusationType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className={`metadata-card ${paymentDestinationClaim === "Not Detected" ? "empty" : ""}`}>
                  <span className="metadata-label">Escrow Target</span>
                  <span className="metadata-value" style={{ textTransform: 'capitalize' }}>
                    {paymentDestinationClaim}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. evidence_package JSON payload */}
            <div className="evidence-package-section">
              <div className="evidence-header-row">
                <span className="section-label">Audit Evidence Package (evidence_package)</span>
                <button
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={openReportWizard}
                  disabled={scamProbability < 0.7}
                >
                  {LOCALIZED_CONTENT[selectedLanguage].ncrbButton}
                </button>
              </div>
              <div className="evidence-block-container">
                <pre className="evidence-code">
                  {JSON.stringify(evidencePackage, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
