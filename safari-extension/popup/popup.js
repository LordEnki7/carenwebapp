var browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

var RIGHTS_DATABASE = {
  "California": {
    traffic: [
      { title: "Right to Refuse Consent to Search", desc: "You may refuse a vehicle search unless the officer has probable cause or a warrant. (Calif. Const. Art. I, § 13)" },
      { title: "Right to Record Police", desc: "California law protects your right to record police performing official duties in public. (Smith v. City of Cumming)" },
      { title: "Right to Remain Silent", desc: "You have the right to remain silent during a traffic stop after identifying yourself. (Miranda v. Arizona)" },
      { title: "Must Provide License & Registration", desc: "You must provide your driver's license, registration, and proof of insurance upon request. (CVC § 12951)" },
    ],
    recording: [
      { title: "Two-Party Consent State", desc: "California requires all parties to consent to recording of confidential conversations. Police interactions in public are generally not considered confidential. (Penal Code § 632)" },
      { title: "Public Recording Protected", desc: "Recording police in public spaces performing official duties is a protected First Amendment activity." },
    ],
    search: [
      { title: "Vehicle Search Rules", desc: "Officers need probable cause, consent, or a warrant to search your vehicle. The automobile exception allows searches with probable cause. (California v. Acevedo)" },
      { title: "Pat-Down Requirements", desc: "Officers may conduct a limited pat-down if they have reasonable suspicion you are armed and dangerous. (Terry v. Ohio)" },
    ],
    accountability: [
      { title: "File a Complaint", desc: "You can file complaints with the department's Internal Affairs division or the Civilian Oversight Board." },
      { title: "Excessive Force", desc: "Officers must use force proportional to the situation. AB 392 restricts use of deadly force to situations where it is necessary. (Penal Code § 835a)" },
    ]
  },
  "Texas": {
    traffic: [
      { title: "Must Identify Yourself", desc: "Texas law requires you to identify yourself when lawfully detained. (Penal Code § 38.02)" },
      { title: "Right to Refuse Search", desc: "You may refuse consent to search your vehicle. Officers need probable cause or a warrant. (Tex. Const. Art. I, § 9)" },
      { title: "Right to Remain Silent", desc: "You have the right to remain silent. Clearly invoke this right verbally." },
      { title: "License & Insurance Required", desc: "You must present your license and proof of financial responsibility. (Transp. Code § 521.025)" },
    ],
    recording: [
      { title: "One-Party Consent State", desc: "Texas is a one-party consent state. You may record conversations you are a party to. (Penal Code § 16.02)" },
      { title: "Recording Officers Permitted", desc: "You may legally record police officers performing duties in public." },
    ],
    search: [
      { title: "Vehicle Search", desc: "Probable cause required for warrantless vehicle searches. (Tex. Code Crim. Proc. Art. 18.01)" },
      { title: "Inventory Searches", desc: "If your vehicle is impounded, officers may conduct an inventory search." },
    ],
    accountability: [
      { title: "TCOLE Complaints", desc: "File complaints with the Texas Commission on Law Enforcement (TCOLE) for officer misconduct." },
      { title: "Body Camera Laws", desc: "Texas requires body cameras for most police officers. (Occ. Code § 1701.661)" },
    ]
  },
  "New York": {
    traffic: [
      { title: "Stop and Identify", desc: "New York does not have a stop-and-identify statute, but you must provide license during traffic stops. (VTL § 501)" },
      { title: "Right to Refuse Search", desc: "You may refuse consent to search your vehicle. (N.Y. Const. Art. I, § 12)" },
      { title: "Right to Remain Silent", desc: "You have the constitutional right to remain silent beyond providing identification." },
      { title: "Right to Attorney", desc: "You have the right to an attorney at any critical stage of a criminal proceeding." },
    ],
    recording: [
      { title: "One-Party Consent State", desc: "New York is a one-party consent state for recording conversations. (Penal Law § 250.00)" },
      { title: "Recording in Public", desc: "You may record police performing official duties in public places." },
    ],
    search: [
      { title: "Vehicle Search Rules", desc: "Warrantless vehicle searches require probable cause. New York courts apply a stricter standard than federal courts." },
      { title: "Stop and Frisk", desc: "Officers may briefly detain and pat down if they have reasonable suspicion of criminal activity and danger. (People v. De Bour)" },
    ],
    accountability: [
      { title: "CCRB Complaints", desc: "File complaints with the Civilian Complaint Review Board (CCRB) in NYC." },
      { title: "Right to Know Act", desc: "Officers must identify themselves and explain why they are stopping or searching you." },
    ]
  },
  "Florida": {
    traffic: [
      { title: "Must Provide ID During Stop", desc: "You must provide identification during a lawful traffic stop. (F.S. § 322.15)" },
      { title: "Right to Refuse Search", desc: "You may refuse consent to search your vehicle unless probable cause exists." },
      { title: "Right to Remain Silent", desc: "You have the right to remain silent after providing identification." },
      { title: "Passenger Rights", desc: "Passengers are not required to identify themselves during a traffic stop unless suspected of a crime." },
    ],
    recording: [
      { title: "Two-Party Consent (with exception)", desc: "Florida generally requires all-party consent for recording, but recording police in public is protected. (F.S. § 934.03)" },
      { title: "Dashcam Permitted", desc: "You may use a dashcam to record while driving." },
    ],
    search: [
      { title: "Vehicle Search", desc: "Officers need probable cause, a warrant, or your consent to search your vehicle." },
      { title: "K-9 Searches", desc: "Officers may use drug-sniffing dogs during a lawful traffic stop without extending the stop unreasonably. (Rodriguez v. United States)" },
    ],
    accountability: [
      { title: "Internal Affairs", desc: "File complaints with the agency's internal affairs division." },
      { title: "Body Camera Requirements", desc: "Many Florida departments require body cameras. Check local policies." },
    ]
  },
  "DEFAULT": {
    traffic: [
      { title: "Right to Remain Silent", desc: "You have the constitutional right to remain silent. Clearly state: 'I am invoking my right to remain silent.' (5th Amendment)" },
      { title: "Right to Refuse Search", desc: "You may refuse consent to search your vehicle. Say: 'I do not consent to a search.' (4th Amendment)" },
      { title: "Right to an Attorney", desc: "You have the right to an attorney. Ask: 'Am I free to leave?' and 'I would like to speak with an attorney.' (6th Amendment)" },
      { title: "Must Provide License", desc: "Most states require you to provide your driver's license, registration, and proof of insurance during a traffic stop." },
    ],
    recording: [
      { title: "Right to Record Police", desc: "Recording police performing official duties in public is protected by the First Amendment. (Glik v. Cunniffe)" },
      { title: "Check Your State's Consent Laws", desc: "Some states require all-party consent for recording conversations. Check your specific state law." },
    ],
    search: [
      { title: "Fourth Amendment Protection", desc: "The Fourth Amendment protects against unreasonable searches and seizures. Officers generally need probable cause or a warrant." },
      { title: "Terry Stop Rules", desc: "Officers may briefly detain you if they have reasonable suspicion of criminal activity. Pat-downs require belief you are armed. (Terry v. Ohio)" },
    ],
    accountability: [
      { title: "File a Complaint", desc: "Contact the police department's internal affairs division or civilian oversight board to file a complaint." },
      { title: "Document Everything", desc: "Record officer badge numbers, patrol car numbers, and any witnesses. Write down details as soon as possible." },
    ]
  }
};

var currentState = null;
var currentCategory = 'traffic';

document.addEventListener('DOMContentLoaded', function() {
  detectLocation();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('btn-sos').addEventListener('click', handleSOS);
  document.getElementById('btn-rights').addEventListener('click', showRights);
  document.getElementById('btn-record').addEventListener('click', handleRecord);
  document.getElementById('btn-close-rights').addEventListener('click', hideRights);

  document.querySelectorAll('.tab').forEach(function(tab) {
    tab.addEventListener('click', function(e) {
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
      e.target.classList.add('active');
      currentCategory = e.target.dataset.category;
      renderRights();
    });
  });
}

async function detectLocation() {
  const statusBar = document.getElementById('status-bar');
  const statusText = document.getElementById('status-text');

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    });

    const { latitude, longitude } = position.coords;
    statusText.textContent = 'Looking up your state...';

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'CAREN-SafariExtension/1.0' } }
    );
    const data = await response.json();

    const state = data.address?.state;
    if (state) {
      currentState = state;
      document.getElementById('state-name').textContent = state;
      document.getElementById('location-info').classList.remove('hidden');
      statusBar.classList.add('active');
      statusText.textContent = `Protected in ${state}`;
    } else {
      throw new Error('State not found');
    }
  } catch (error) {
    statusBar.classList.add('error');
    statusText.textContent = 'Location unavailable — using general rights';
    currentState = null;
    document.getElementById('state-name').textContent = 'United States';
    document.getElementById('location-info').classList.remove('hidden');
  }
}

function handleSOS() {
  const btn = document.getElementById('btn-sos');
  btn.style.transform = 'scale(0.95)';
  setTimeout(() => { btn.style.transform = ''; }, 150);

  try {
    browserAPI.runtime.sendMessage({ action: 'activateSOS', state: currentState });
  } catch (e) {
    console.log('Extension messaging not available');
  }

  window.open('https://carenalert.com/panic', '_blank');
}

function showRights() {
  document.getElementById('rights-panel').classList.remove('hidden');
  document.getElementById('category-tabs').classList.remove('hidden');
  renderRights();
}

function hideRights() {
  document.getElementById('rights-panel').classList.add('hidden');
  document.getElementById('category-tabs').classList.add('hidden');
}

function renderRights() {
  const content = document.getElementById('rights-content');
  const stateData = RIGHTS_DATABASE[currentState] || RIGHTS_DATABASE['DEFAULT'];
  const rights = stateData[currentCategory] || stateData['traffic'];

  const title = document.getElementById('rights-title');
  title.textContent = currentState
    ? `${currentState} — ${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}`
    : `Your Rights — ${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}`;

  content.innerHTML = rights.map(r => `
    <div class="right-item">
      <div class="right-title">${r.title}</div>
      <div class="right-desc">${r.desc}</div>
    </div>
  `).join('');
}

function handleRecord() {
  window.open('https://carenalert.com/recording', '_blank');
}
