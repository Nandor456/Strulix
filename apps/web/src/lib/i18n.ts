export type AppLanguage = "en" | "ro" | "hu";
export type TranslationParams = Record<string, string | number>;

export const LANGUAGE_STORAGE_KEY = "buildpulse-language";

export const APP_LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  ro: "Romana",
  hu: "Magyar",
};

export const APP_LANGUAGES = Object.keys(APP_LANGUAGE_LABELS) as AppLanguage[];

const messages: Record<Exclude<AppLanguage, "en">, Record<string, string>> = {
  ro: {
    "ADMIN": "Administrator",
    "ACCEPTED": "Acceptata",
    "Address": "Adresa",
    "Actions": "Actiuni",
    "Already completed today": "Deja finalizata astazi",
    "Already have an account?": "Ai deja un cont?",
    "All workpoints": "Toate punctele de lucru",
    "Allow camera access to scan attendance.":
      "Permite accesul la camera pentru a inregistra prezenta.",
    "Allow location access to scan attendance.":
      "Permite accesul la locatie pentru a inregistra prezenta.",
    "After changing the browser setting, reload this page and try again.":
      "Dupa ce schimbi setarea din browser, reincarca pagina si incearca din nou.",
    "Ask an admin to set your wage":
      "Cere unui administrator sa iti seteze salariul",
    "Attendance": "Prezenta",
    "Attendance by workpoint": "Prezenta pe punct de lucru",
    "Attendance days": "Zile de prezenta",
    "Attendance scan": "Scanare prezenta",
    "Auto": "Auto",
    "Auto-closed": "Inchisa automat",
    "Automatically closed at 22:00": "Inchisa automat la 22:00",
    "Browse your job sites and open one to manage its workers, attendance, and QR tools.":
      "Rasfoieste santierele tale si deschide unul pentru a gestiona muncitorii, prezenta si instrumentele QR.",
    "Camera scanning requires HTTPS.": "Scanarea camerei necesita HTTPS.",
    "Cancel": "Anuleaza",
    "Change language": "Schimba limba",
    "Checked in": "Intrare inregistrata",
    "Checked out": "Iesire inregistrata",
    "Complete": "Complete",
    "Completed attendances only": "Doar prezentele finalizate",
    "Configured on your worker profile": "Configurat in profilul tau de muncitor",
    "Coordinates are generated automatically from the address.":
      "Coordonatele sunt generate automat din adresa.",
    "Copied!": "Copiat!",
    "Copy invite link": "Copiaza linkul invitatiei",
    "Create account": "Creeaza cont",
    "Create workpoint": "Creeaza punct de lucru",
    "Create your account": "Creeaza-ti contul",
    "Creating account…": "Se creeaza contul…",
    "Current workpoints assigned to you.":
      "Punctele de lucru care iti sunt alocate acum.",
    "Dark theme": "Tema inchisa",
    "Date": "Data",
    "Days": "Zile",
    "Deadline": "Termen limita",
    "Delete": "Sterge",
    "Delete workpoint": "Sterge punctul de lucru",
    "Description": "Descriere",
    "Documents": "Documente",
    "Done": "Gata",
    "Download": "Descarca",
    "Download document": "Descarca documentul",
    "Earnings": "Castiguri",
    "Edit workpoint": "Editeaza punctul de lucru",
    "Email": "Email",
    "Email address": "Adresa de email",
    "Email is locked to the invited address.":
      "Emailul este blocat la adresa din invitatie.",
    "Email is required.": "Emailul este obligatoriu.",
    "EXPIRED": "Expirata",
    "Expires": "Expira",
    "Failed to load invitations.": "Invitatiile nu au putut fi incarcate.",
    "Failed to load workpoints.": "Punctele de lucru nu au putut fi incarcate.",
    "Failed to load your documents.":
      "Documentele tale nu au putut fi incarcate.",
    "Failed to load your worker dashboard.":
      "Tabloul tau de bord nu a putut fi incarcat.",
    "Failed to save workpoint": "Punctul de lucru nu a putut fi salvat",
    "Failed to send invitation": "Invitatia nu a putut fi trimisa",
    "File": "Fisier",
    "Home": "Acasa",
    "Hourly wage": "Salariu pe ora",
    "Hours": "Ore",
    "Image": "Imagine",
    "Initial workers": "Muncitori initiali",
    "Invalid date": "Data invalida",
    "Invalid QR code.": "Cod QR invalid.",
    "Invitations": "Invitatii",
    "Invite a new user": "Invita un utilizator nou",
    "Invite new users by email. Each invitation carries a role and a one-time registration link.":
      "Invita utilizatori noi prin email. Fiecare invitatie include un rol si un link unic de inregistrare.",
    "Join the Construction ERP system":
      "Alatura-te sistemului ERP pentru constructii",
    "LEADER": "Sef echipa",
    "Leader": "Sef echipa",
    "Light theme": "Tema deschisa",
    "Location timed out. Move somewhere with a clearer signal and try again.":
      "Locatia a expirat. Mergi intr-un loc cu semnal mai bun si incearca din nou.",
    "Location access requires HTTPS.":
      "Accesul la locatie necesita HTTPS.",
    "Location is required to record attendance at this workpoint.":
      "Locatia este necesara pentru a inregistra prezenta la acest punct de lucru.",
    "Location is still blocked by the browser or device. Allow location for this site and for the browser app, then reload the page.":
      "Locatia este inca blocata de browser sau dispozitiv. Permite locatia pentru acest site si pentru aplicatia browserului, apoi reincarca pagina.",
    "Location required": "Locatie necesara",
    "Log out": "Deconectare",
    "Login failed": "Autentificarea a esuat",
    "Messages": "Mesaje",
    "Missing check-out": "Iesire lipsa",
    "Month": "Luna",
    "Monthly earnings": "Castiguri lunare",
    "Must start with an uppercase letter and be at least 6 characters.":
      "Trebuie sa inceapa cu o litera mare si sa aiba cel putin 6 caractere.",
    "Name": "Nume",
    "Name and address are required.":
      "Numele si adresa sunt obligatorii.",
    "Network error. Please try again.":
      "Eroare de retea. Incearca din nou.",
    "New workpoint": "Punct de lucru nou",
    "No account?": "Nu ai cont?",
    "No attendance recorded here for {periodLabel}.":
      "Nu exista prezenta inregistrata aici pentru {periodLabel}.",
    "No attendance records for {periodLabel}.":
      "Nu exista inregistrari de prezenta pentru {periodLabel}.",
    "No camera was found on this device.":
      "Nu a fost gasita nicio camera pe acest dispozitiv.",
    "No documents have been shared with you yet.":
      "Nu au fost distribuite documente pentru tine inca.",
    "No invitations yet. Use the form above to invite your first user.":
      "Nu exista invitatii inca. Foloseste formularul de mai sus pentru a invita primul utilizator.",
    "No workers available.": "Nu exista muncitori disponibili.",
    "No workpoints are assigned to you yet.":
      "Nu ai niciun punct de lucru alocat inca.",
    "No workpoints yet. Create one to start assigning workers.":
      "Nu exista puncte de lucru inca. Creeaza unul pentru a incepe alocarea muncitorilor.",
    "Not set": "Nesetat",
    "Open": "Deschide",
    "Open records": "Inregistrari deschise",
    "Open workpoint": "Deschide punctul de lucru",
    "PENDING": "In asteptare",
    "Password": "Parola",
    "Password must start with an uppercase letter and be at least 6 characters.":
      "Parola trebuie sa inceapa cu o litera mare si sa aiba cel putin 6 caractere.",
    "PDF": "PDF",
    "Pending": "In asteptare",
    "Place the attendance QR code inside the frame.":
      "Asaza codul QR de prezenta in interiorul cadrului.",
    "Please enter a username and password.":
      "Introdu un nume de utilizator si o parola.",
    "Point the camera at the attendance QR code.":
      "Indreapta camera spre codul QR de prezenta.",
    "Preparing scan": "Se pregateste scanarea",
    "Previous": "Anterior",
    "Previous workpoint": "Punct de lucru anterior",
    "Preview and download documents shared with your worker profile.":
      "Previzualizeaza si descarca documentele distribuite profilului tau de muncitor.",
    "Preview is not available for this document.":
      "Previzualizarea nu este disponibila pentru acest document.",
    "Recording attendance...": "Se inregistreaza prezenta...",
    "Register": "Inregistrare",
    "Registration failed": "Inregistrarea a esuat",
    "Reload page": "Reincarca pagina",
    "Enable location": "Activeaza locatia",
    "REVOKED": "Revocata",
    "Revoke invitation": "Revoca invitatia",
    "Role": "Rol",
    "Save": "Salveaza",
    "Saving...": "Se salveaza...",
    "Scan a BuildPulse attendance QR code.":
      "Scaneaza un cod QR de prezenta BuildPulse.",
    "Scan attendance": "Scaneaza prezenta",
    "Scan QR": "Scaneaza QR",
    "Scan result": "Rezultatul scanarii",
    "Select a document to preview it.":
      "Selecteaza un document pentru a-l previzualiza.",
    "Send invitation": "Trimite invitatia",
    "Sending…": "Se trimite…",
    "Sent": "Trimisa",
    "Sign in": "Autentificare",
    "Signing in…": "Se autentifica…",
    "Starting camera...": "Se porneste camera...",
    "Status": "Stare",
    "This attendance was already completed for today.":
      "Aceasta prezenta a fost deja finalizata pentru astazi.",
    "This attendance was automatically closed at 22:00 and may need review.":
      "Aceasta prezenta a fost inchisa automat la 22:00 si poate necesita verificare.",
    "This browser cannot provide location for attendance scans.":
      "Acest browser nu poate furniza locatia pentru scanarea prezentei.",
    "Total hours": "Total ore",
    "Track your assigned workpoints, attendance, hours, and wage-based earnings for {periodLabel}.":
      "Urmareste punctele de lucru alocate, prezenta, orele si castigurile bazate pe salariu pentru {periodLabel}.",
    "Try again": "Incearca din nou",
    "Unable to get your current location. Check location services and try again.":
      "Nu s-a putut obtine locatia ta curenta. Verifica serviciile de localizare si incearca din nou.",
    "Unable to record attendance.":
      "Prezenta nu a putut fi inregistrata.",
    "Unable to start the camera scanner.":
      "Scannerul camerei nu a putut fi pornit.",
    "Unavailable": "Indisponibil",
    "Uploaded {date}": "Incarcat la {date}",
    "User Invitations": "Invitatii utilizatori",
    "Username": "Nume utilizator",
    "Username must be at least 3 characters.":
      "Numele de utilizator trebuie sa aiba cel putin 3 caractere.",
    "Users": "Utilizatori",
    "Welcome back to BuildPulse": "Bine ai revenit la BuildPulse",
    "Workpoint": "Punct de lucru",
    "Workpoints": "Puncte de lucru",
    "WORKER": "Muncitor",
    "Worker": "Muncitor",
    "Worker dashboard": "Tablou de bord muncitor",
    "Worker management": "Gestionare muncitori",
    "Workers": "Muncitori",
    "Your BuildPulse home": "Panoul tau BuildPulse",
    "Your documents": "Documentele tale",
    "Your own check-ins and check-outs for {periodLabel}.":
      "Intrarile si iesirile tale pentru {periodLabel}.",
    "You're accepting an invitation. Your role will be assigned automatically.":
      "Accepti o invitatie. Rolul tau va fi atribuit automat.",
    "{count} complete": "{count} complete",
    "{count} complete days": "{count} zile complete",
    "{count} records": "{count} inregistrari",
  },
  hu: {
    "ADMIN": "Adminisztrator",
    "ACCEPTED": "Elfogadva",
    "Address": "Cim",
    "Actions": "Muveletek",
    "Already completed today": "Ma mar lezarva",
    "Already have an account?": "Mar van fiokod?",
    "All workpoints": "Osszes munkapont",
    "Allow camera access to scan attendance.":
      "Engedelyezd a kamera hasznalatat a jelenlet rogzitesehez.",
    "Allow location access to scan attendance.":
      "Engedelyezd a helyhozzaferest a jelenlet rogzitesehez.",
    "After changing the browser setting, reload this page and try again.":
      "A bongeszo beallitasanak modositasa utan toltsd ujra az oldalt, majd probald ujra.",
    "Ask an admin to set your wage":
      "Kerj meg egy adminisztratort, hogy allitsa be a beredet",
    "Attendance": "Jelenlet",
    "Attendance by workpoint": "Jelenlet munkapontonkent",
    "Attendance days": "Jelenleti napok",
    "Attendance scan": "Jelenlet szkennelese",
    "Auto": "Auto",
    "Auto-closed": "Automatikusan zarva",
    "Automatically closed at 22:00": "Automatikusan zarva 22:00-kor",
    "Browse your job sites and open one to manage its workers, attendance, and QR tools.":
      "Bongessz a munkateruleteid kozott, es nyiss meg egyet a dolgozok, a jelenlet es a QR eszkozok kezelesere.",
    "Camera scanning requires HTTPS.":
      "A kamera szkenneleshez HTTPS szukseges.",
    "Cancel": "Megse",
    "Change language": "Nyelvvaltas",
    "Checked in": "Belepes rogzitve",
    "Checked out": "Kilepes rogzitve",
    "Complete": "Lezart",
    "Completed attendances only": "Csak a lezart jelenletek",
    "Configured on your worker profile": "A dolgozoi profilodon beallitva",
    "Coordinates are generated automatically from the address.":
      "A koordinatak automatikusan keszulnek a cimből.",
    "Copied!": "Masolva!",
    "Copy invite link": "Meghivo link masolasa",
    "Create account": "Fiok letrehozasa",
    "Create workpoint": "Munkapont letrehozasa",
    "Create your account": "Hozd letre a fiokodat",
    "Creating account…": "Fiok letrehozasa folyamatban…",
    "Current workpoints assigned to you.":
      "A jelenleg hozzad rendelt munkapontok.",
    "Dark theme": "Sotet tema",
    "Date": "Datum",
    "Days": "Napok",
    "Deadline": "Hatarido",
    "Delete": "Torles",
    "Delete workpoint": "Munkapont torlese",
    "Description": "Leiras",
    "Documents": "Dokumentumok",
    "Done": "Kesz",
    "Download": "Letoltes",
    "Download document": "Dokumentum letoltese",
    "Earnings": "Kereset",
    "Edit workpoint": "Munkapont szerkesztese",
    "Email": "Email",
    "Email address": "Email cim",
    "Email is locked to the invited address.":
      "Az email cim a meghivott cimre van rogzitve.",
    "Email is required.": "Az email cim kotelezo.",
    "EXPIRED": "Lejart",
    "Expires": "Lejar",
    "Failed to load invitations.":
      "A meghivok betoltese nem sikerult.",
    "Failed to load workpoints.":
      "A munkapontok betoltese nem sikerult.",
    "Failed to load your documents.":
      "A dokumentumok betoltese nem sikerult.",
    "Failed to load your worker dashboard.":
      "A dolgozoi attekintes betoltese nem sikerult.",
    "Failed to save workpoint": "A munkapont mentese nem sikerult",
    "Failed to send invitation": "A meghivo kuldese nem sikerult",
    "File": "Fajl",
    "Home": "Kezdolap",
    "Hourly wage": "Oraber",
    "Hours": "Orak",
    "Image": "Kep",
    "Initial workers": "Kezdeti dolgozok",
    "Invalid date": "Ervenytelen datum",
    "Invalid QR code.": "Ervenytelen QR-kod.",
    "Invitations": "Meghivok",
    "Invite a new user": "Uj felhasznalo meghivasa",
    "Invite new users by email. Each invitation carries a role and a one-time registration link.":
      "Hivj meg uj felhasznalokat emailben. Minden meghivohoz szerepkor es egyszer hasznalhato regisztracios link tartozik.",
    "Join the Construction ERP system":
      "Csatlakozz az epitoipari ERP rendszerhez",
    "LEADER": "Csapatvezeto",
    "Leader": "Csapatvezeto",
    "Light theme": "Vilagos tema",
    "Location timed out. Move somewhere with a clearer signal and try again.":
      "A helymeghatarozas idotullepessel leallt. Menj jobb jelu helyre, es probald ujra.",
    "Location access requires HTTPS.":
      "A helyhozzafereshez HTTPS szukseges.",
    "Location is required to record attendance at this workpoint.":
      "A jelenlet rogzitesehez helyadat szukseges ezen a munkaponton.",
    "Location is still blocked by the browser or device. Allow location for this site and for the browser app, then reload the page.":
      "A helyadatot meg mindig blokkolja a bongeszo vagy az eszkoz. Engedelyezd a helyhozzaferest ehhez a webhelyhez es a bongeszo alkalmazashoz, majd toltsd ujra az oldalt.",
    "Location required": "Helyadat szukseges",
    "Log out": "Kijelentkezes",
    "Login failed": "A belepes sikertelen",
    "Messages": "Uzenetek",
    "Missing check-out": "Hianyzo kilepes",
    "Month": "Honap",
    "Monthly earnings": "Havi kereset",
    "Must start with an uppercase letter and be at least 6 characters.":
      "Nagybetuvel kell kezdodnie, es legalabb 6 karakterbol kell allnia.",
    "Name": "Nev",
    "Name and address are required.": "A nev es a cim kotelezo.",
    "Network error. Please try again.":
      "Halozati hiba. Probald ujra.",
    "New workpoint": "Uj munkapont",
    "No account?": "Nincs fiokod?",
    "No attendance recorded here for {periodLabel}.":
      "Itt nincs rogzitett jelenlet erre: {periodLabel}.",
    "No attendance records for {periodLabel}.":
      "Nincsenek jelenleti adatok erre: {periodLabel}.",
    "No camera was found on this device.":
      "Nem talalhato kamera ezen az eszkozon.",
    "No documents have been shared with you yet.":
      "Meg nem osztottak meg veled dokumentumokat.",
    "No invitations yet. Use the form above to invite your first user.":
      "Meg nincsenek meghivok. A fenti urlappal hivhatod meg az elso felhasznalot.",
    "No workers available.": "Nincs elerheto dolgozo.",
    "No workpoints are assigned to you yet.":
      "Meg nincs hozzad rendelt munkapont.",
    "No workpoints yet. Create one to start assigning workers.":
      "Meg nincsenek munkapontok. Hozz letre egyet a dolgozok hozzarendelesehez.",
    "Not set": "Nincs beallitva",
    "Open": "Megnyitas",
    "Open records": "Nyitott bejegyzesek",
    "Open workpoint": "Munkapont megnyitasa",
    "PENDING": "Fuggoben",
    "Password": "Jelszo",
    "Password must start with an uppercase letter and be at least 6 characters.":
      "A jelszonak nagybetuvel kell kezdodnie, es legalabb 6 karakteresnek kell lennie.",
    "PDF": "PDF",
    "Pending": "Fuggoben",
    "Place the attendance QR code inside the frame.":
      "Helyezd a jelenleti QR-kodot a keretbe.",
    "Please enter a username and password.":
      "Adj meg egy felhasznalonevet es egy jelszot.",
    "Point the camera at the attendance QR code.":
      "Iritsd a kamerat a jelenleti QR-kodra.",
    "Preparing scan": "Szkenneles elokeszitese",
    "Previous": "Korabbi",
    "Previous workpoint": "Korabbi munkapont",
    "Preview and download documents shared with your worker profile.":
      "Tekintsd meg es toltsd le a dolgozoi profilodhoz megosztott dokumentumokat.",
    "Preview is not available for this document.":
      "Ehhez a dokumentumhoz nem erheto el elonezet.",
    "Recording attendance...": "Jelenlet rogzitese folyamatban...",
    "Register": "Regisztracio",
    "Registration failed": "A regisztracio sikertelen",
    "Reload page": "Oldal ujratoltese",
    "Enable location": "Hely engedelyezese",
    "REVOKED": "Visszavonva",
    "Revoke invitation": "Meghivo visszavonasa",
    "Role": "Szerepkor",
    "Save": "Mentes",
    "Saving...": "Mentes folyamatban...",
    "Scan a BuildPulse attendance QR code.":
      "Szkennelj be egy BuildPulse jelenleti QR-kodot.",
    "Scan attendance": "Jelenlet szkennelese",
    "Scan QR": "QR szkennelese",
    "Scan result": "Szkenneles eredmenye",
    "Select a document to preview it.":
      "Valassz ki egy dokumentumot az elonezethez.",
    "Send invitation": "Meghivo kuldese",
    "Sending…": "Kuldes…",
    "Sent": "Elkuldes",
    "Sign in": "Belepes",
    "Signing in…": "Belepes folyamatban…",
    "Starting camera...": "Kamera inditasa...",
    "Status": "Allapot",
    "This attendance was already completed for today.":
      "Ez a jelenlet mar le lett zarva mara.",
    "This attendance was automatically closed at 22:00 and may need review.":
      "Ez a jelenlet automatikusan lezarult 22:00-kor, es ellenorzesre szorulhat.",
    "This browser cannot provide location for attendance scans.":
      "Ez a bongeszo nem tud helyadatot adni a jelenlet szkenneleshez.",
    "Total hours": "Osszes ora",
    "Track your assigned workpoints, attendance, hours, and wage-based earnings for {periodLabel}.":
      "Kovetesre a hozzad rendelt munkapontok, a jelenlet, az orak es a beralapu keresetek ehhez: {periodLabel}.",
    "Try again": "Probald ujra",
    "Unable to get your current location. Check location services and try again.":
      "Nem sikerult meghatarozni a jelenlegi helyzetedet. Ellenorizd a helymeghatarozast, es probald ujra.",
    "Unable to record attendance.":
      "A jelenlet rogzitese nem sikerult.",
    "Unable to start the camera scanner.":
      "A kamera szkennelo inditasa nem sikerult.",
    "Unavailable": "Nem erheto el",
    "Uploaded {date}": "Feltoltve: {date}",
    "User Invitations": "Felhasznaloi meghivok",
    "Username": "Felhasznalonev",
    "Username must be at least 3 characters.":
      "A felhasznalonevnek legalabb 3 karakteresnek kell lennie.",
    "Users": "Felhasznalok",
    "Welcome back to BuildPulse": "Udvozol ujra a BuildPulse-ban",
    "Workpoint": "Munkapont",
    "Workpoints": "Munkapontok",
    "WORKER": "Munkas",
    "Worker": "Munkas",
    "Worker dashboard": "Dolgozoi attekintes",
    "Worker management": "Dolgozok kezelese",
    "Workers": "Dolgozok",
    "Your BuildPulse home": "A te BuildPulse kezdolapod",
    "Your documents": "Sajat dokumentumok",
    "Your own check-ins and check-outs for {periodLabel}.":
      "A sajat belepeseid es kilepeseid {periodLabel} idoszakban.",
    "You're accepting an invitation. Your role will be assigned automatically.":
      "Egy meghivot fogadsz el. A szerepkorod automatikusan be lesz allitva.",
    "{count} complete": "{count} lezart",
    "{count} complete days": "{count} teljes nap",
    "{count} records": "{count} bejegyzes",
  },
};

export function getSystemLanguage(locale?: string): AppLanguage {
  const value = (locale ?? "").toLowerCase();
  if (value.startsWith("ro")) return "ro";
  if (value.startsWith("hu")) return "hu";
  return "en";
}

export function getStoredLanguage(): AppLanguage | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return APP_LANGUAGES.includes(value as AppLanguage)
    ? (value as AppLanguage)
    : null;
}

export function getInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  return getStoredLanguage() ?? getSystemLanguage(window.navigator.language);
}

export function syncDocumentLanguage(language: AppLanguage) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
}

export function translateMessage(
  language: AppLanguage,
  key: string,
  params?: TranslationParams,
) {
  const template = language === "en" ? key : messages[language][key] ?? key;
  if (!params) return template;

  let result = template;
  for (const [name, value] of Object.entries(params)) {
    result = result.replaceAll(`{${name}}`, String(value));
  }
  return result;
}
