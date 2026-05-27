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
    "Click a start date, then an end date.":
      "Apasa o data de inceput, apoi o data de sfarsit.",
    "Days": "Zile",
    "Mon": "Lun",
    "Tue": "Mar",
    "Wed": "Mie",
    "Thu": "Joi",
    "Fri": "Vin",
    "Sat": "Sam",
    "Sun": "Dum",
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
    "Please enter a valid email address.":
      "Te rugam sa introduci o adresa de email valida.",
    "Email must be at most 254 characters.":
      "Emailul poate avea cel mult 254 de caractere.",
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
    "Location is still blocked by the browser or device. Allow location for this site and for the browser app, then scan the QR code again.":
      "Locatia este inca blocata de browser sau dispozitiv. Permite locatia pentru acest site si pentru aplicatia browserului, apoi scaneaza din nou codul QR.",
    "Location required": "Locatie necesara",
    "Are you sure you want to log out?":
      "Esti sigur ca vrei sa te deconectezi?",
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
    "Password must start with an uppercase letter.":
      "Parola trebuie sa inceapa cu o litera mare.",
    "Password must be at least 6 characters.":
      "Parola trebuie sa aiba cel putin 6 caractere.",
    "Password must be at most 100 characters.":
      "Parola poate avea cel mult 100 de caractere.",
    "Password is required.": "Parola este obligatorie.",
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
    "Previous month": "Luna anterioara",
    "Next month": "Luna urmatoare",
    "Previous workpoint": "Punct de lucru anterior",
    "Preview and download documents shared with your worker profile.":
      "Previzualizeaza si descarca documentele distribuite profilului tau de muncitor.",
    "Preview is not available for this document.":
      "Previzualizarea nu este disponibila pentru acest document.",
    "Record attendance": "Inregistreaza prezenta",
    "Recording attendance...": "Se inregistreaza prezenta...",
    "Register": "Inregistrare",
    "Registration failed": "Inregistrarea a esuat",
    "Username already taken": "Numele de utilizator este deja folosit.",
    "Username must be at most 50 characters.":
      "Numele de utilizator poate avea cel mult 50 de caractere.",
    "An invitation token is required to register":
      "Este necesar un token de invitatie pentru inregistrare.",
    "Invitation is invalid, expired, or does not match this email":
      "Invitatia este invalida, expirata sau nu se potriveste cu acest email.",
    "Invitation token cannot be empty.":
      "Tokenul de invitatie nu poate fi gol.",
    "Invitation token is too long.":
      "Tokenul de invitatie este prea lung.",
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
    "Use your current location to record attendance at this workpoint.":
      "Foloseste locatia curenta pentru a inregistra prezenta la acest punct de lucru.",
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
    "Add": "Adauga",
    "Add a check-in and optional check-out for an assigned worker.":
      "Adauga o intrare si o iesire optionala pentru un muncitor alocat.",
    "Assign": "Aloca",
    "Assign worker": "Aloca muncitor",
    "Assigned workers": "Muncitori alocati",
    "Attachment": "Atasament",
    "Automatically closed at 22:00. Edit to mark reviewed.":
      "Inchisa automat la 22:00. Editeaza pentru a marca verificarea.",
    "BuildPulse": "BuildPulse",
    "BuildPulse logo": "Sigla BuildPulse",
    "by {name}": "de {name}",
    "Check in": "Intrare",
    "Check out": "Iesire",
    "Check-in time": "Ora intrarii",
    "Check-out time": "Ora iesirii",
    "Choose a conversation from the list or start a new one.":
      "Alege o conversatie din lista sau incepe una noua.",
    "Choose worker": "Alege muncitor",
    "Close": "Inchide",
    "Close notification": "Inchide notificarea",
    "Conversations": "Conversatii",
    "Created": "Creat",
    "Delete attendance": "Sterge prezenta",
    "Delete attendance for {name}?": "Stergi prezenta pentru {name}?",
    "Delete worker": "Sterge muncitorul",
    "Delete {name}?": "Stergi {name}?",
    "Delete document": "Sterge documentul",
    "Deleting…": "Se sterge…",
    "Displays the mobile sidebar.": "Afiseaza bara laterala pe mobil.",
    "Documents for {name}": "Documente pentru {name}",
    "Download QR": "Descarca QR",
    "Edit attendance hours": "Editeaza orele de prezenta",
    "Edit hours": "Editeaza orele",
    "Edit worker": "Editeaza muncitorul",
    "e.g. 35.50": "ex. 35.50",
    "Export": "Exporta",
    "Failed to add attendance": "Prezenta nu a putut fi adaugata.",
    "Failed to load this workpoint.": "Punctul de lucru nu a putut fi incarcat.",
    "Failed to load workpoint documents.":
      "Documentele punctului de lucru nu au putut fi incarcate.",
    "Failed to update attendance hours": "Orele de prezenta nu au putut fi actualizate.",
    "Failed to update worker": "Muncitorul nu a putut fi actualizat.",
    "Failed to upload document": "Documentul nu a putut fi incarcat.",
    "Filter records and export the same period to Excel.":
      "Filtreaza inregistrarile si exporta aceeasi perioada in Excel.",
    "From": "De la",
    "h": "h",
    "Hourly wage (RON)": "Salariu pe ora (RON)",
    "KB": "KB",
    "MB": "MB",
    "Manual attendance": "Prezenta manuala",
    "Manual mark": "Marcare manuala",
    "Manage assignments, attendance, QR access, and exports for this site.":
      "Gestioneaza alocarile, prezenta, accesul QR si exporturile pentru acest punct.",
    "Manage registered workers and their documents.":
      "Gestioneaza muncitorii inregistrati si documentele lor.",
    "Manage worker documents": "Gestioneaza documentele muncitorului",
    "Messaging": "Mesagerie",
    "New conversation": "Conversatie noua",
    "No attendance records for this period.":
      "Nu exista inregistrari de prezenta pentru aceasta perioada.",
    "No conversation selected": "Nicio conversatie selectata",
    "No conversations match your search.":
      "Nicio conversatie nu se potriveste cautarii.",
    "No conversations yet.": "Nu exista conversatii inca.",
    "No messages yet": "Nu exista mesaje inca",
    "No documents uploaded for this worker.":
      "Nu exista documente incarcate pentru acest muncitor.",
    "No documents uploaded for this workpoint.":
      "Nu exista documente incarcate pentru acest punct de lucru.",
    "No users found": "Nu au fost gasiti utilizatori",
    "No wage": "Fara salariu",
    "No workers assigned to this workpoint.":
      "Nu exista muncitori alocati acestui punct de lucru.",
    "No workers registered yet.": "Nu exista muncitori inregistrati inca.",
    "Offline": "Offline",
    "Online": "Online",
    "Preview document": "Previzualizeaza documentul",
    "QR check-in": "Check-in QR",
    "QR code is not available yet.": "Codul QR nu este disponibil inca.",
    "Records": "Inregistrari",
    "Remove worker": "Elimina muncitor",
    "Rotate": "Roteste",
    "Rotate this QR code? Existing printed codes will stop working.":
      "Rotesti acest cod QR? Codurile tiparite existente nu vor mai functiona.",
    "Search conversations…": "Cauta conversatii…",
    "Search users...": "Cauta utilizatori...",
    "Sidebar": "Bara laterala",
    "Source": "Sursa",
    "That workpoint could not be found.": "Acest punct de lucru nu a putut fi gasit.",
    "Toggle Sidebar": "Comuta bara laterala",
    "To": "Pana la",
    "Upload": "Incarca",
    "Worker documents": "Documente muncitor",
    "Workpoint check-in QR code": "Cod QR de check-in pentru punctul de lucru",
    "Workpoint details": "Detalii punct de lucru",
    "Workpoint documents": "Documente punct de lucru",
    "Write a message… (Enter to send, Shift+Enter for newline)":
      "Scrie un mesaj… (Enter pentru trimitere, Shift+Enter pentru rand nou)",
    "Leave Calendar": "Calendar concedii",
    "Select a leave period directly on the calendar.":
      "Selecteaza direct in calendar perioada de concediu.",
    "Review employee leave requests and approved absences.":
      "Revizuieste cererile de concediu ale angajatilor si absentele aprobate.",
    "Failed to load leave requests.":
      "Cererile de concediu nu au putut fi incarcate.",
    "You cannot select past dates.": "Nu poti selecta date din trecut.",
    "End date cannot be before start date":
      "Data de sfarsit nu poate fi inaintea datei de inceput.",
    "This period overlaps with an existing request.":
      "Aceasta perioada se suprapune cu o cerere existenta.",
    "Please select a start and end date.":
      "Te rugam sa selectezi o data de inceput si una de sfarsit.",
    "Please choose a leave type.": "Te rugam sa alegi un tip de concediu.",
    "Leave request submitted.": "Cererea de concediu a fost trimisa.",
    "User not found": "Utilizatorul nu a fost gasit.",
    "Admins cannot create leave requests":
      "Administratorii nu pot crea cereri de concediu.",
    "Only admins and leaders can review requests":
      "Doar administratorii si sefii de echipa pot revizui cererile.",
    "Failed to submit leave request.":
      "Cererea de concediu nu a putut fi trimisa.",
    "Leave request approved.": "Cererea de concediu a fost aprobata.",
    "Leave request not found": "Cererea de concediu nu a fost gasita.",
    "You cannot review your own leave request":
      "Nu iti poti revizui propria cerere de concediu.",
    "Only pending requests can be reviewed":
      "Doar cererile in asteptare pot fi revizuite.",
    "Failed to approve leave request.":
      "Cererea de concediu nu a putut fi aprobata.",
    "Leave request rejected.": "Cererea de concediu a fost respinsa.",
    "Failed to reject leave request.":
      "Cererea de concediu nu a putut fi respinsa.",
    "Cancel this pending request?": "Anulezi aceasta cerere in asteptare?",
    "Leave request canceled.": "Cererea de concediu a fost anulata.",
    "You can only cancel your own requests":
      "Poti anula doar propriile tale cereri.",
    "Only pending requests can be canceled":
      "Doar cererile in asteptare pot fi anulate.",
    "Failed to cancel leave request.":
      "Cererea de concediu nu a putut fi anulata.",
    "Approved leave is highlighted on the calendar.":
      "Concediile aprobate sunt evidentiate in calendar.",
    "Vacation leave": "Concediu de odihna",
    "Sick leave": "Concediu medical",
    "Leave type": "Tip concediu",
    "Choose leave type": "Alege tipul de concediu",
    "Selected period": "Perioada selectata",
    "Not selected": "Neselectat",
    "Start date": "Data de inceput",
    "End date": "Data de sfarsit",
    "Submitting...": "Se trimite...",
    "Submit request": "Trimite cererea",
    "Clear": "Goleste",
    "Pending approvals": "Aprobari in asteptare",
    "Requests waiting for a manager decision.":
      "Cereri in asteptarea unei decizii de la manager.",
    "No pending requests.": "Nu exista cereri in asteptare.",
    "All leave requests": "Toate cererile de concediu",
    "Your leave requests": "Cererile tale de concediu",
    "Approved and rejected requests stay visible here.":
      "Cereri aprobate si respinse raman vizibile aici.",
    "Track your submitted leave requests and approval status.":
      "Urmareste cererile de concediu trimise si statusul aprobarii.",
    "No reviewed leave requests yet.": "Nu exista cereri revizuite inca.",
    "No leave requests yet.": "Nu exista cereri de concediu inca.",
    "Approved": "Aprobata",
    "Rejected": "Respinsa",
    "Submitted": "Trimisa",
    "Approve": "Aproba",
    "Reject": "Respinge",
    "Cancel request": "Anuleaza cererea",
    "{count} days": "{count} zile",
    "you@example.com": "tu@example.com",
    "your.username": "numele.tau",
    "user@example.com": "utilizator@example.com",
    "{amount} RON/h": "{amount} RON/h",
    "{count} members": "{count} membri",
    "now": "acum",
    "Loading": "Se incarca",
    "B": "B",
    "GB": "GB",
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
    "Click a start date, then an end date.":
      "Kattints egy kezdo datumra, majd egy vegdatumra.",
    "Days": "Napok",
    "Mon": "Het",
    "Tue": "Ked",
    "Wed": "Sze",
    "Thu": "Csu",
    "Fri": "Pent",
    "Sat": "Szo",
    "Sun": "Vas",
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
    "Please enter a valid email address.":
      "Adj meg egy ervenyes email cimet.",
    "Email must be at most 254 characters.":
      "Az email cim legfeljebb 254 karakter lehet.",
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
    "Location is still blocked by the browser or device. Allow location for this site and for the browser app, then scan the QR code again.":
      "A helyadatot meg mindig blokkolja a bongeszo vagy az eszkoz. Engedelyezd a helyhozzaferest ehhez a webhelyhez es a bongeszo alkalmazashoz, majd szkenneld be ujra a QR-kodot.",
    "Location required": "Helyadat szukseges",
    "Are you sure you want to log out?":
      "Biztosan ki szeretnel jelentkezni?",
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
    "Password must start with an uppercase letter.":
      "A jelszonak nagybetuvel kell kezdodnie.",
    "Password must be at least 6 characters.":
      "A jelszonak legalabb 6 karakteresnek kell lennie.",
    "Password must be at most 100 characters.":
      "A jelszo legfeljebb 100 karakter lehet.",
    "Password is required.": "A jelszo kotelezo.",
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
    "Previous month": "Elozo honap",
    "Next month": "Kovetkezo honap",
    "Previous workpoint": "Korabbi munkapont",
    "Preview and download documents shared with your worker profile.":
      "Tekintsd meg es toltsd le a dolgozoi profilodhoz megosztott dokumentumokat.",
    "Preview is not available for this document.":
      "Ehhez a dokumentumhoz nem erheto el elonezet.",
    "Record attendance": "Jelenlet rogzitese",
    "Recording attendance...": "Jelenlet rogzitese folyamatban...",
    "Register": "Regisztracio",
    "Registration failed": "A regisztracio sikertelen",
    "Username already taken": "Ez a felhasznalonev mar foglalt.",
    "Username must be at most 50 characters.":
      "A felhasznalonev legfeljebb 50 karakter lehet.",
    "An invitation token is required to register":
      "A regisztraciohoz meghivo token szukseges.",
    "Invitation is invalid, expired, or does not match this email":
      "A meghivo ervenytelen, lejart, vagy nem ehhez az email cimhez tartozik.",
    "Invitation token cannot be empty.":
      "A meghivo token nem lehet ures.",
    "Invitation token is too long.":
      "A meghivo token tul hosszu.",
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
    "Use your current location to record attendance at this workpoint.":
      "Hasznald az aktualis helyzetedet a jelenlet rogzitesehez ezen a munkaponton.",
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
    "Add": "Hozzaad",
    "Add a check-in and optional check-out for an assigned worker.":
      "Adj hozza egy belepest es opcionis kilepest egy kijelolt dolgozohoz.",
    "Assign": "Hozzarendel",
    "Assign worker": "Dolgozo hozzarendelese",
    "Assigned workers": "Kijelolt dolgozok",
    "Attachment": "Melleklet",
    "Automatically closed at 22:00. Edit to mark reviewed.":
      "Automatikusan lezarva 22:00-kor. Szerkeszd a megtekintes jelolesehez.",
    "BuildPulse": "BuildPulse",
    "BuildPulse logo": "BuildPulse logo",
    "by {name}": "{name} altal",
    "Check in": "Belepes",
    "Check out": "Kilepes",
    "Check-in time": "Belepes ideje",
    "Check-out time": "Kilepes ideje",
    "Choose a conversation from the list or start a new one.":
      "Valassz egy beszelgetest a listabol vagy indits egy ujat.",
    "Choose worker": "Valassz dolgozot",
    "Close": "Bezar",
    "Close notification": "Ertesites bezarasa",
    "Conversations": "Beszelgetesek",
    "Created": "Letrehozva",
    "Delete attendance": "Jelenlet torlese",
    "Delete attendance for {name}?": "Toroljuk a jelenletet {name} szamara?",
    "Delete worker": "Dolgozo torlese",
    "Delete {name}?": "Toroljuk {name}?",
    "Delete document": "Dokumentum torlese",
    "Deleting…": "Torles...",
    "Displays the mobile sidebar.": "Megjeleniti a mobil oldalsavot.",
    "Documents for {name}": "Dokumentumok: {name}",
    "Download QR": "QR letoltese",
    "Edit attendance hours": "Jelenleti orak szerkesztese",
    "Edit hours": "Orak szerkesztese",
    "Edit worker": "Dolgozo szerkesztese",
    "e.g. 35.50": "pl. 35.50",
    "Export": "Export",
    "Failed to add attendance": "A jelenlet hozzaadasa nem sikerult.",
    "Failed to load this workpoint.": "A munkapont betoltese nem sikerult.",
    "Failed to load workpoint documents.":
      "A munkapont dokumentumainak betoltese nem sikerult.",
    "Failed to update attendance hours": "A jelenleti orak frissitese nem sikerult.",
    "Failed to update worker": "A dolgozo frissitese nem sikerult.",
    "Failed to upload document": "A dokumentum feltoltese nem sikerult.",
    "Filter records and export the same period to Excel.":
      "Szurd a bejegyzeseket, es exportald ugyanezt az idoszakot Excelbe.",
    "From": "Tol",
    "h": "h",
    "Hourly wage (RON)": "Oraber (RON)",
    "KB": "KB",
    "MB": "MB",
    "Manual attendance": "Manualis jelenlet",
    "Manual mark": "Manualis jeloles",
    "Manage assignments, attendance, QR access, and exports for this site.":
      "Kezeld a hozzarendeleseket, a jelenletet, a QR-hozzaferest es az exportokat ezen a helyen.",
    "Manage registered workers and their documents.":
      "Kezeld a regisztralt dolgozokat es dokumentumaikat.",
    "Manage worker documents": "Dolgozoi dokumentumok kezelese",
    "Messaging": "Uzenetkuldes",
    "New conversation": "Uj beszelgetes",
    "No attendance records for this period.":
      "Nincsenek jelenleti adatok erre az idoszakra.",
    "No conversation selected": "Nincs kivalasztott beszelgetes",
    "No conversations match your search.":
      "Nincs a keresessel egyezo beszelgetes.",
    "No conversations yet.": "Meg nincs beszelgetes.",
    "No messages yet": "Meg nincs uzenet",
    "No documents uploaded for this worker.":
      "Ehhez a dolgozohoz meg nincs feltoltott dokumentum.",
    "No documents uploaded for this workpoint.":
      "Ehhez a munkaponthoz meg nincs feltoltott dokumentum.",
    "No users found": "Nem talalhato felhasznalo",
    "No wage": "Nincs ber",
    "No workers assigned to this workpoint.":
      "Ehhez a munkaponthoz nincs dolgozo hozzarendelve.",
    "No workers registered yet.": "Meg nincs regisztralt dolgozo.",
    "Offline": "Offline",
    "Online": "Online",
    "Preview document": "Dokumentum elonezete",
    "QR check-in": "QR check-in",
    "QR code is not available yet.": "A QR-kod meg nem elerheto.",
    "Records": "Bejegyzesek",
    "Remove worker": "Dolgozo eltavolitasa",
    "Rotate": "Forgatas",
    "Rotate this QR code? Existing printed codes will stop working.":
      "Forgatod ezt a QR-kodot? A korabbi nyomtatott kodok mar nem fognak mukodni.",
    "Search conversations…": "Beszelgetesek keresese…",
    "Search users...": "Felhasznalok keresese...",
    "Sidebar": "Oldalsav",
    "Source": "Forras",
    "That workpoint could not be found.": "Ez a munkapont nem talalhato.",
    "Toggle Sidebar": "Oldalsav kapcsolasa",
    "To": "Ig",
    "Upload": "Feltoltes",
    "Worker documents": "Dolgozoi dokumentumok",
    "Workpoint check-in QR code": "Munkaponti check-in QR-kod",
    "Workpoint details": "Munkapont reszletei",
    "Workpoint documents": "Munkapont dokumentumai",
    "Write a message… (Enter to send, Shift+Enter for newline)":
      "Irj uzenetet… (Enter kuldeshez, Shift+Enter uj sorhoz)",
    "Leave Calendar": "Szabadsag naptar",
    "Select a leave period directly on the calendar.":
      "Valassz ki egy szabadsagidoszakot kozvetlenul a naptaron.",
    "Review employee leave requests and approved absences.":
      "Nezd at a dolgozok szabadsagkerelmeit es a jovahagyott tavolleteket.",
    "Failed to load leave requests.":
      "A szabadsagkerelmek betoltese nem sikerult.",
    "You cannot select past dates.": "Nem valaszthatsz multbeli datumokat.",
    "End date cannot be before start date":
      "A befejezo datum nem lehet korabban, mint a kezdo datum.",
    "This period overlaps with an existing request.":
      "Ez az idoszak atfedi egy letezo kerelmet.",
    "Please select a start and end date.":
      "Kerlek valassz kezdo- es vegdatumot.",
    "Please choose a leave type.": "Kerlek valassz szabadsagtipust.",
    "Leave request submitted.": "Szabadsagkerelmet elkuldtuk.",
    "User not found": "A felhasznalo nem talalhato.",
    "Admins cannot create leave requests":
      "Az adminisztratorok nem hozhatnak letre szabadsagkereseket.",
    "Only admins and leaders can review requests":
      "Csak adminisztratorok es csapatvezetok biralhatnak el kerelmeket.",
    "Failed to submit leave request.":
      "A szabadsagkeres elkuldese nem sikerult.",
    "Leave request approved.": "A szabadsagkeres jovahagyva.",
    "Leave request not found": "A szabadsagkeres nem talalhato.",
    "You cannot review your own leave request":
      "Nem biralhatod el a sajat szabadsagkerelmedet.",
    "Only pending requests can be reviewed":
      "Csak fuggoben levo kerelmek biralhatok el.",
    "Failed to approve leave request.":
      "A szabadsagkeres jovahagyasa nem sikerult.",
    "Leave request rejected.": "A szabadsagkeres elutasitva.",
    "Failed to reject leave request.":
      "A szabadsagkeres elutasitasa nem sikerult.",
    "Cancel this pending request?": "Toroljuk ezt a fuggoben levo kerelmet?",
    "Leave request canceled.": "A szabadsagkeres torolve.",
    "You can only cancel your own requests":
      "Csak a sajat kerelmeidet torolheted.",
    "Only pending requests can be canceled":
      "Csak a fuggoben levo kerelmek torolhetok.",
    "Failed to cancel leave request.":
      "A szabadsagkeres torlese nem sikerult.",
    "Approved leave is highlighted on the calendar.":
      "A jovahagyott szabadsag ki van emelve a naptaron.",
    "Vacation leave": "Szabadsag",
    "Sick leave": "Betegszabadsag",
    "Leave type": "Szabadsag tipusa",
    "Choose leave type": "Valassz szabadsagtipust",
    "Selected period": "Kivalasztott idoszak",
    "Not selected": "Nincs kivalasztva",
    "Start date": "Kezdo datum",
    "End date": "Vegdatum",
    "Submitting...": "Kuldese folyamatban...",
    "Submit request": "Kerelmet kuld",
    "Clear": "Torles",
    "Pending approvals": "Fuggoben levo jovahagyasok",
    "Requests waiting for a manager decision.":
      "A vezeto dontesere varo kerelmek.",
    "No pending requests.": "Nincsenek fuggoben levo kerelmek.",
    "All leave requests": "Osszes szabadsagkeres",
    "Your leave requests": "Sajat szabadsagkereseid",
    "Approved and rejected requests stay visible here.":
      "A jovahagyott es elutasitott kerelmek itt maradnak.",
    "Track your submitted leave requests and approval status.":
      "Kovesd a bekuldott szabadsagkerelmeket es a jovahagyas statuszat.",
    "No reviewed leave requests yet.": "Meg nincsenek elbiralt kerelmek.",
    "No leave requests yet.": "Meg nincsenek szabadsagkerelmek.",
    "Approved": "Jovahagyva",
    "Rejected": "Elutasitva",
    "Submitted": "Bekuldve",
    "Approve": "Jovahagy",
    "Reject": "Elutasit",
    "Cancel request": "Kerelmet torol",
    "{count} days": "{count} nap",
    "you@example.com": "te@example.com",
    "your.username": "felhasznalonev",
    "user@example.com": "felhasznalo@example.com",
    "{amount} RON/h": "{amount} RON/h",
    "{count} members": "{count} tag",
    "now": "most",
    "Loading": "Betoltes",
    "B": "B",
    "GB": "GB",
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
