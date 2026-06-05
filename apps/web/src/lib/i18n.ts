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
    "ACCEPTED": "Acceptată",
    "Address": "Adresă",
    "Actions": "Acțiuni",
    "Already completed today": "Deja finalizată astăzi",
    "Already have an account?": "Ai deja un cont?",
    "All workpoints": "Toate punctele de lucru",
    "Allow camera access to scan attendance.":
      "Permite accesul la cameră pentru a înregistra prezența.",
    "Allow location access to scan attendance.":
      "Permite accesul la locație pentru a înregistra prezența.",
    "Ask an admin to set your wage":
      "Cere unui administrator să îți seteze salariul",
    "Attendance": "Prezență",
    "Attendance by workpoint": "Prezență pe punct de lucru",
    "Attendance days": "Zile de prezență",
    "Attendance scan": "Scanare prezență",
    "Auto": "Auto",
    "Auto-closed": "Închisă automat",
    "Automatically closed at 22:00": "Închisă automat la 22:00",
    "Browse your job sites and open one to manage its workers, attendance, and QR tools.":
      "Răsfoiește șantierele tale și deschide unul pentru a gestiona muncitorii, prezența și instrumentele QR.",
    "Camera scanning requires HTTPS.": "Scanarea camerei necesită HTTPS.",
    "Cancel": "Anulează",
    "Change language": "Schimbă limba",
    "Checked in": "Intrare înregistrată",
    "Checked out": "Ieșire înregistrată",
    "Complete": "Complete",
    "Completed attendances only": "Doar prezențele finalizate",
    "Company name": "Numele companiei",
    "Company name is required.": "Numele companiei este obligatoriu.",
    "Construction operations for teams in motion":
      "Operațiuni de construcții pentru echipe în mișcare",
    "Coordinate workpoints, QR attendance, worker documents, leave requests, and team messaging in one focused construction operations system.":
      "Coordonează punctele de lucru, prezența QR, documentele muncitorilor, cererile de concediu și mesajele echipei într-un sistem concentrat pentru operațiuni de construcții.",
    "Configured on your worker profile": "Configurat în profilul tău de muncitor",
    "Coordinates are generated automatically from the address.":
      "Coordonatele sunt generate automat din adresă.",
    "Copied!": "Copiat!",
    "Copy invite link": "Copiază linkul invitației",
    "Create account": "Creează cont",
    "Create first administrator": "Creează primul administrator",
    "Create the first company administrator":
      "Creează primul administrator al companiei",
    "Create workpoint": "Creează punct de lucru",
    "Create your account": "Creează-ți contul",
    "Creating account…": "Se creează contul…",
    "Current workpoints assigned to you.":
      "Punctele de lucru care îți sunt alocate acum.",
    "Dark theme": "Tema închisă",
    "Date": "Dată",
    "Click a start date, then an end date.":
      "Apasă o dată de început, apoi o dată de sfârșit.",
    "Days": "Zile",
    "Mon": "Lun",
    "Tue": "Mar",
    "Wed": "Mie",
    "Thu": "Joi",
    "Fri": "Vin",
    "Sat": "Sâm",
    "Sun": "Dum",
    "Deadline": "Termen-limită",
    "Delete": "Șterge",
    "Delete workpoint": "Șterge punctul de lucru",
    "Description": "Descriere",
    "Documents": "Documente",
    "Done": "Gata",
    "Download": "Descarcă",
    "Download document": "Descarcă documentul",
    "Earnings": "Câștiguri",
    "Edit workpoint": "Editează punctul de lucru",
    "Email": "Email",
    "Email address": "Adresă de email",
    "Email is locked to the invited address.":
      "Emailul este blocat la adresa din invitație.",
    "Email is required.": "Emailul este obligatoriu.",
    "Please enter a valid email address.":
      "Te rugăm să introduci o adresă de email validă.",
    "Email must be at most 254 characters.":
      "Emailul poate avea cel mult 254 de caractere.",
    "EXPIRED": "Expirată",
    "Expires": "Expiră",
    "Failed to load invitations.": "Invitațiile nu au putut fi încărcate.",
    "Failed to load workpoints.": "Punctele de lucru nu au putut fi încărcate.",
    "Failed to load your documents.":
      "Documentele tale nu au putut fi încărcate.",
    "Failed to load your worker dashboard.":
      "Tabloul tău de bord nu a putut fi încărcat.",
    "Failed to save workpoint": "Punctul de lucru nu a putut fi salvat",
    "Failed to send invitation": "Invitația nu a putut fi trimisă",
    "File": "Fișier",
    "Home": "Acasă",
    "Hourly wage": "Salariu pe oră",
    "Hours": "Ore",
    "Image": "Imagine",
    "Invalid date": "Dată invalidă",
    "Invalid QR code.": "Cod QR invalid.",
    "Invitations": "Invitații",
    "Invite a new user": "Invită un utilizator nou",
    "Invite new users by email. Each invitation carries a role and a one-time registration link.":
      "Invită utilizatori noi prin email. Fiecare invitație include un rol și un link unic de înregistrare.",
    "Invite leaders and workers, keep roles clear, and organize communication around real work.":
      "Invită șefi de echipă și muncitori, păstrează rolurile clare și organizează comunicarea în jurul muncii reale.",
    "Join the Construction ERP system":
      "Alătură-te sistemului ERP pentru construcții",
    "LEADER": "Șef de echipă",
    "Leader": "Șef de echipă",
    "Light theme": "Tema deschisă",
    "Leave and documents": "Concedii și documente",
    "Location timed out. Move somewhere with a clearer signal and try again.":
      "Locația a expirat. Mergi într-un loc cu semnal mai bun și încearcă din nou.",
    "Location access requires HTTPS.":
      "Accesul la locație necesită HTTPS.",
    "Location is required to record attendance at this workpoint.":
      "Locația este necesară pentru a înregistra prezența la acest punct de lucru.",
    "Location is still blocked by the browser or device. Allow location for this site and for the browser app, then scan the QR code again.":
      "Locația este încă blocată de browser sau dispozitiv. Permite locația pentru acest site și pentru aplicația browserului, apoi scanează din nou codul QR.",
    "Location required": "Locație necesară",
    "Are you sure you want to log out?":
      "Ești sigur că vrei să te deconectezi?",
    "Ask your company administrator for an invitation.":
      "Cere administratorului companiei o invitație.",
    "Handle leave requests, worker files, and workpoint documents without spreadsheet drift.":
      "Gestionează cererile de concediu, fișierele muncitorilor și documentele punctelor de lucru fără tabele care scapă de sub control.",
    "Log out": "Deconectare",
    "Login": "Autentificare",
    "Login failed": "Autentificarea a eșuat",
    "Messages": "Mesaje",
    "Missing check-out": "Ieșire lipsă",
    "Month": "Lună",
    "Monthly earnings": "Câștiguri lunare",
    "Must start with an uppercase letter and be at least 6 characters.":
      "Trebuie să înceapă cu o literă mare și să aibă cel puțin 6 caractere.",
    "Name": "Nume",
    "Name and address are required.":
      "Numele și adresa sunt obligatorii.",
    "Network error. Please try again.":
      "Eroare de rețea. Încearcă din nou.",
    "Need access?": "Ai nevoie de acces?",
    "New company registration will open after payment is available. For now, use an invitation link or request access.":
      "Înregistrarea companiilor noi se va deschide după ce plata este disponibilă. Deocamdată, folosește un link de invitație sau solicită acces.",
    "For first-time setup on an empty database, use the bootstrap registration flow.":
      "Pentru configurarea inițială pe o bază de date goală, folosește fluxul de înregistrare bootstrap.",
    "New workpoint": "Punct de lucru nou",
    "No account?": "Nu ai cont?",
    "No attendance recorded here for {periodLabel}.":
      "Nu există prezență înregistrată aici pentru {periodLabel}.",
    "No attendance records for {periodLabel}.":
      "Nu există înregistrări de prezență pentru {periodLabel}.",
    "No camera was found on this device.":
      "Nu a fost găsită nicio cameră pe acest dispozitiv.",
    "No documents have been shared with you yet.":
      "Nu ți-au fost distribuite documente încă.",
    "No invitations yet. Use the form above to invite your first user.":
      "Nu există invitații încă. Folosește formularul de mai sus pentru a invita primul utilizator.",
    "No workers available.": "Nu există muncitori disponibili.",
    "No workpoints are assigned to you yet.":
      "Nu ai niciun punct de lucru alocat încă.",
    "No workpoints yet. Create one to start tracking attendance.":
      "Nu există puncte de lucru încă. Creează unul pentru a începe urmărirea prezenței.",
    "Not set": "Nesetat",
    "Open": "Deschide",
    "Open records": "Înregistrări deschise",
    "Open workpoint": "Deschide punctul de lucru",
    "PENDING": "În așteptare",
    "Password": "Parolă",
    "Password must start with an uppercase letter and be at least 6 characters.":
      "Parola trebuie să înceapă cu o literă mare și să aibă cel puțin 6 caractere.",
    "Password must start with an uppercase letter.":
      "Parola trebuie să înceapă cu o literă mare.",
    "Password must be at least 6 characters.":
      "Parola trebuie să aibă cel puțin 6 caractere.",
    "Password must be at most 100 characters.":
      "Parola poate avea cel mult 100 de caractere.",
    "Password is required.": "Parola este obligatorie.",
    "PDF": "PDF",
    "Pending": "În așteptare",
    "Pending leave": "Concedii în așteptare",
    "Plan and manage job sites, assigned workers, documents, and daily attendance from one place.":
      "Planifică și gestionează șantierele, muncitorii alocați, documentele și prezența zilnică dintr-un singur loc.",
    "Place the attendance QR code inside the frame.":
      "Așază codul QR de prezență în interiorul cadrului.",
    "Please enter a username and password.":
      "Introdu un nume de utilizator și o parolă.",
    "Point the camera at the attendance QR code.":
      "Îndreaptă camera spre codul QR de prezență.",
    "Preparing scan": "Se pregătește scanarea",
    "Previous": "Anterior",
    "Previous month": "Luna anterioară",
    "Next month": "Luna următoare",
    "Previous workpoint": "Punct de lucru anterior",
    "Preview and download documents shared with your worker profile.":
      "Previzualizează și descarcă documentele distribuite profilului tău de muncitor.",
    "Preview is not available for this document.":
      "Previzualizarea nu este disponibilă pentru acest document.",
    "QR attendance": "Prezență QR",
    "Record attendance": "Înregistrează prezența",
    "Recording attendance...": "Se înregistrează prezența...",
    "Register": "Înregistrare",
    "Registration is invite-only": "Înregistrarea este doar pe bază de invitație",
    "Registration is invite-only until payment is available.":
      "Înregistrarea este doar pe bază de invitație până când plata este disponibilă.",
    "Registration failed": "Înregistrarea a eșuat",
    "Request access": "Solicită acces",
    "Username already taken": "Numele de utilizator este deja folosit.",
    "Username must be at most 50 characters.":
      "Numele de utilizator poate avea cel mult 50 de caractere.",
    "An invitation token is required to register":
      "Este necesar un token de invitație pentru înregistrare.",
    "Invitation is invalid, expired, or does not match this email":
      "Invitația este invalidă, expirată sau nu se potrivește cu acest email.",
    "Invitation token cannot be empty.":
      "Tokenul de invitație nu poate fi gol.",
    "Invitation token is too long.":
      "Tokenul de invitație este prea lung.",
    "Enable location": "Activează locația",
    "REVOKED": "Revocată",
    "Revoke invitation": "Revocă invitația",
    "Role": "Rol",
    "Save": "Salvează",
    "Saving...": "Se salvează...",
    "Scan a Strulix attendance QR code.":
      "Scanează un cod QR de prezență Strulix.",
    "Scan attendance": "Scanează prezența",
    "Scan QR": "Scanează QR",
    "Scan result": "Rezultatul scanării",
    "Select a document to preview it.":
      "Selectează un document pentru a-l previzualiza.",
    "Send invitation": "Trimite invitația",
    "Sending…": "Se trimite…",
    "Sent": "Trimisă",
    "Sign in": "Autentificare",
    "Signing in…": "Se autentifică…",
    "Starting camera...": "Se pornește camera...",
    "Status": "Stare",
    "This attendance was already completed for today.":
      "Această prezență a fost deja finalizată pentru astăzi.",
    "This attendance was automatically closed at 22:00 and may need review.":
      "Această prezență a fost închisă automat la 22:00 și poate necesita verificare.",
    "This browser cannot provide location for attendance scans.":
      "Acest browser nu poate furniza locația pentru scanarea prezenței.",
    "Team operations": "Operațiuni de echipă",
    "Total hours": "Total ore",
    "Track your assigned workpoints, attendance, hours, and wage-based earnings for {periodLabel}.":
      "Urmărește punctele de lucru alocate, prezența, orele și câștigurile bazate pe salariu pentru {periodLabel}.",
    "Try again": "Încearcă din nou",
    "Use your current location to record attendance at this workpoint.":
      "Folosește locația curentă pentru a înregistra prezența la acest punct de lucru.",
    "Unable to get your current location. Check location services and try again.":
      "Nu s-a putut obține locația ta curentă. Verifică serviciile de localizare și încearcă din nou.",
    "Unable to record attendance.":
      "Prezența nu a putut fi înregistrată.",
    "Unable to start the camera scanner.":
      "Scannerul camerei nu a putut fi pornit.",
    "Unavailable": "Indisponibil",
    "Uploaded {date}": "Încărcat la {date}",
    "User Invitations": "Invitații utilizatori",
    "Username": "Nume utilizator",
    "Username must be at least 3 characters.":
      "Numele de utilizator trebuie să aibă cel puțin 3 caractere.",
    "Users": "Utilizatori",
    "Welcome back to Strulix": "Bine ai revenit la Strulix",
    "Workpoint": "Punct de lucru",
    "Workpoints": "Puncte de lucru",
    "WORKER": "Muncitor",
    "Worker": "Muncitor",
    "Worker dashboard": "Tablou de bord muncitor",
    "Worker management": "Gestionare muncitori",
    "Workers": "Muncitori",
    "Workers scan on site while managers review hours, missing check-outs, and Excel exports.":
      "Muncitorii scanează pe șantier, iar managerii verifică orele, ieșirile lipsă și exporturile Excel.",
    "Workpoint control": "Controlul punctelor de lucru",
    "Your company": "Compania ta",
    "Your Strulix home": "Panoul tău Strulix",
    "Your documents": "Documentele tale",
    "Your own check-ins and check-outs for {periodLabel}.":
      "Intrările și ieșirile tale pentru {periodLabel}.",
    "You're accepting an invitation. Your role will be assigned automatically.":
      "Accepți o invitație. Rolul tău va fi atribuit automat.",
    "Add": "Adaugă",
    "Add a check-in and optional check-out for a worker.":
      "Adaugă o intrare și o ieșire opțională pentru un muncitor.",
    "Attachment": "Atașament",
    "Automatically closed at 22:00. Edit to mark reviewed.":
      "Închisă automat la 22:00. Editează pentru a marca verificarea.",
    "Strulix": "Strulix",
    "Strulix logo": "Sigla Strulix",
    "Strulix keeps field work, office review, and worker self-service connected without adding another messy spreadsheet.":
      "Strulix conectează munca de pe șantier, verificarea din birou și autoservirea muncitorilor fără încă un tabel dezordonat.",
    "Bootstrap registration only works when it is enabled on the API and no company exists yet.":
      "Înregistrarea bootstrap funcționează doar când este activată în API și nu există încă nicio companie.",
    "Built for the daily rhythm of construction work":
      "Creat pentru ritmul zilnic al lucrărilor de construcții",
    "by {name}": "de {name}",
    "Check in": "Intrare",
    "Check out": "Ieșire",
    "Check-in time": "Ora intrării",
    "Check-out time": "Ora ieșirii",
    "Choose a conversation from the list or start a new one.":
      "Alege o conversație din listă sau începe una nouă.",
    "Choose worker": "Alege muncitor",
    "Close": "Închide",
    "Close notification": "Închide notificarea",
    "Conversations": "Conversații",
    "Created": "Creat",
    "Delete attendance": "Șterge prezența",
    "Delete attendance for {name}?": "Ștergi prezența pentru {name}?",
    "Delete worker": "Șterge muncitorul",
    "Delete {name}?": "Ștergi {name}?",
    "Delete document": "Șterge documentul",
    "Deleting…": "Se șterge…",
    "Displays the mobile sidebar.": "Afișează bara laterală pe mobil.",
    "Documents for {name}": "Documente pentru {name}",
    "Download QR": "Descarcă QR",
    "Edit attendance hours": "Editează orele de prezență",
    "Edit hours": "Editează orele",
    "Edit worker": "Editează muncitorul",
    "e.g. 35.50": "ex. 35.50",
    "Export": "Exportă",
    "Failed to add attendance": "Prezența nu a putut fi adăugată.",
    "Failed to load this workpoint.": "Punctul de lucru nu a putut fi încărcat.",
    "Failed to load workpoint documents.":
      "Documentele punctului de lucru nu au putut fi încărcate.",
    "Failed to update attendance hours": "Orele de prezență nu au putut fi actualizate.",
    "Failed to update worker": "Muncitorul nu a putut fi actualizat.",
    "Failed to upload document": "Documentul nu a putut fi încărcat.",
    "Filter records and export the same period to Excel.":
      "Filtrează înregistrările și exportă aceeași perioadă în Excel.",
    "From": "De la",
    "h": "h",
    "Hourly wage (RON)": "Salariu pe oră (RON)",
    "KB": "KB",
    "MB": "MB",
    "Manual attendance": "Prezență manuală",
    "Manual mark": "Marcare manuală",
    "Manage attendance, QR access, documents, and exports for this site.":
      "Gestionează prezența, accesul QR, documentele și exporturile pentru acest punct.",
    "Manage registered workers and their documents.":
      "Gestionează muncitorii înregistrați și documentele lor.",
    "Manage worker documents": "Gestionează documentele muncitorului",
    "Messaging": "Mesagerie",
    "New conversation": "Conversație nouă",
    "No attendance records for this period.":
      "Nu există înregistrări de prezență pentru această perioadă.",
    "No conversation selected": "Nicio conversație selectată",
    "No conversations match your search.":
      "Nicio conversație nu se potrivește căutării.",
    "No conversations yet.": "Nu există conversații încă.",
    "No messages yet": "Nu există mesaje încă",
    "No documents uploaded for this worker.":
      "Nu există documente încărcate pentru acest muncitor.",
    "No documents uploaded for this workpoint.":
      "Nu există documente încărcate pentru acest punct de lucru.",
    "No users found": "Nu au fost găsiți utilizatori",
    "No wage": "Fără salariu",
    "No workers have checked in to this workpoint yet.":
      "Niciun muncitor nu a intrat încă la acest punct de lucru.",
    "No workers registered yet.": "Nu există muncitori înregistrați încă.",
    "Offline": "Offline",
    "Online": "Online",
    "Preview document": "Previzualizează documentul",
    "QR check-in": "Check-in QR",
    "QR code is not available yet.": "Codul QR nu este disponibil încă.",
    "Records": "Înregistrări",
    "Rotate": "Rotește",
    "Rotate this QR code? Existing printed codes will stop working.":
      "Rotești acest cod QR? Codurile tipărite existente nu vor mai funcționa.",
    "Search conversations…": "Caută conversații…",
    "Search users...": "Caută utilizatori...",
    "Sidebar": "Bara laterală",
    "Source": "Sursă",
    "That workpoint could not be found.": "Acest punct de lucru nu a putut fi găsit.",
    "Toggle Sidebar": "Comută bara laterală",
    "To": "Până la",
    "Upload": "Încarcă",
    "Worker documents": "Documente muncitor",
    "Workpoint check-in QR code": "Cod QR de check-in pentru punctul de lucru",
    "Workpoint details": "Detalii punct de lucru",
    "Workpoint documents": "Documente punct de lucru",
    "Write a message… (Enter to send, Shift+Enter for newline)":
      "Scrie un mesaj… (Enter pentru trimitere, Shift+Enter pentru rând nou)",
    "Leave Calendar": "Calendar concedii",
    "Select a leave period directly on the calendar.":
      "Selectează direct în calendar perioada de concediu.",
    "Review employee leave requests and approved absences.":
      "Revizuiește cererile de concediu ale angajaților și absențele aprobate.",
    "Failed to load leave requests.":
      "Cererile de concediu nu au putut fi încărcate.",
    "You cannot select past dates.": "Nu poți selecta date din trecut.",
    "End date cannot be before start date":
      "Data de sfârșit nu poate fi înaintea datei de început.",
    "This period overlaps with an existing request.":
      "Această perioadă se suprapune cu o cerere existentă.",
    "Please select a start and end date.":
      "Te rugăm să selectezi o dată de început și una de sfârșit.",
    "Please choose a leave type.": "Te rugăm să alegi un tip de concediu.",
    "Leave request submitted.": "Cererea de concediu a fost trimisă.",
    "User not found": "Utilizatorul nu a fost găsit.",
    "Admins cannot create leave requests":
      "Administratorii nu pot crea cereri de concediu.",
    "Only admins and leaders can review requests":
      "Doar administratorii și șefii de echipă pot revizui cererile.",
    "Failed to submit leave request.":
      "Cererea de concediu nu a putut fi trimisă.",
    "Leave request approved.": "Cererea de concediu a fost aprobată.",
    "Leave request not found": "Cererea de concediu nu a fost găsită.",
    "You cannot review your own leave request":
      "Nu îți poți revizui propria cerere de concediu.",
    "Only pending requests can be reviewed":
      "Doar cererile în așteptare pot fi revizuite.",
    "Failed to approve leave request.":
      "Cererea de concediu nu a putut fi aprobată.",
    "Leave request rejected.": "Cererea de concediu a fost respinsă.",
    "Failed to reject leave request.":
      "Cererea de concediu nu a putut fi respinsă.",
    "Cancel this pending request?": "Anulezi această cerere în așteptare?",
    "Leave request canceled.": "Cererea de concediu a fost anulată.",
    "You can only cancel your own requests":
      "Poți anula doar propriile tale cereri.",
    "Only pending requests can be canceled":
      "Doar cererile în așteptare pot fi anulate.",
    "Failed to cancel leave request.":
      "Cererea de concediu nu a putut fi anulată.",
    "Approved leave is highlighted on the calendar.":
      "Concediile aprobate sunt evidențiate în calendar.",
    "Vacation leave": "Concediu de odihnă",
    "Sick leave": "Concediu medical",
    "Leave type": "Tip concediu",
    "Choose leave type": "Alege tipul de concediu",
    "Selected period": "Perioada selectată",
    "Not selected": "Neselectat",
    "Start date": "Data de început",
    "End date": "Data de sfârșit",
    "Submitting...": "Se trimite...",
    "Submit request": "Trimite cererea",
    "Clear": "Golește",
    "Pending approvals": "Aprobări în așteptare",
    "Requests waiting for a manager decision.":
      "Cereri în așteptarea unei decizii de la manager.",
    "No pending requests.": "Nu există cereri în așteptare.",
    "All leave requests": "Toate cererile de concediu",
    "Your leave requests": "Cererile tale de concediu",
    "Approved and rejected requests stay visible here.":
      "Cererile aprobate și respinse rămân vizibile aici.",
    "Track your submitted leave requests and approval status.":
      "Urmărește cererile de concediu trimise și statusul aprobării.",
    "No reviewed leave requests yet.": "Nu există cereri revizuite încă.",
    "No leave requests yet.": "Nu există cereri de concediu încă.",
    "Approved": "Aprobată",
    "Rejected": "Respinsă",
    "Submitted": "Trimisă",
    "Approve": "Aprobă",
    "Reject": "Respinge",
    "Cancel request": "Anulează cererea",
    "{count} days": "{count} zile",
    "you@example.com": "tu@example.com",
    "your.username": "numele.tau",
    "user@example.com": "utilizator@example.com",
    "{amount} RON/h": "{amount} RON/h",
    "{count} members": "{count} membri",
    "now": "acum",
    "Loading": "Se încarcă",
    "B": "B",
    "GB": "GB",
    "{count} complete": "{count} complete",
    "{count} complete days": "{count} zile complete",
    "{count} records": "{count} înregistrări",
    "ACTIVE": "Activ",
    "TRIALING": "Perioadă de probă",
    "UNPAID": "Neplătit",
    "PAST_DUE": "Plată întârziată",
    "CANCELED": "Anulat",
    "Active users": "Utilizatori activi",
    "Automatic": "Automat",
    "Billing": "Facturare",
    "Billing attention needed": "Facturarea necesită atenție",
    "Billing is required to continue.":
      "Facturarea este necesară pentru a continua.",
    "Strulix updates Stripe when invited users accept or when users are removed, including prorated monthly changes.":
      "Strulix actualizează Stripe când utilizatorii invitați acceptă sau când utilizatorii sunt eliminați, inclusiv ajustările lunare proporționale.",
    "Checkout session is required.": "Sesiunea de checkout este obligatorie.",
    "Completing your signup": "Se finalizează înregistrarea",
    "Continue to payment": "Continuă la plată",
    "Create your company workspace": "Creează spațiul companiei",
    "Current period ends {date}": "Perioada curentă se încheie la {date}",
    "Current status": "Stare curentă",
    "Failed to complete paid registration":
      "Înregistrarea plătită nu a putut fi finalizată",
    "Failed to load billing status.":
      "Starea facturării nu a putut fi încărcată.",
    "Failed to start checkout": "Checkout-ul nu a putut fi pornit",
    "Manage billing": "Gestionează facturarea",
    "Manage your Strulix subscription and user-based billing.":
      "Gestionează abonamentul Strulix și facturarea pe utilizator.",
    "Monthly price": "Preț lunar",
    "New companies can start with paid signup. Invited users should use their invitation link.":
      "Companiile noi pot începe cu înregistrarea plătită. Utilizatorii invitați trebuie să folosească linkul de invitație.",
    "No current billing period is available.":
      "Nu este disponibilă nicio perioadă de facturare curentă.",
    "No payment provider": "Niciun furnizor de plată",
    "Opening checkout…": "Se deschide checkout-ul…",
    "Operational changes are paused until billing is fixed.":
      "Modificările operaționale sunt suspendate până la rezolvarea facturării.",
    "Paid seats": "Locuri plătite",
    "Seat updates": "Actualizări locuri",
    "secure checkout and tax handling":
      "checkout securizat și gestionarea taxelor",
    "Simple per-user billing": "Facturare simplă pe utilizator",
    "Start for €3/user/month": "Începe cu 3 €/utilizator/lună",
    "Start paid signup": "Începe înregistrarea plătită",
    "Start with one admin seat, then pay monthly only for users who accept invitations and join your company.":
      "Începi cu un loc de administrator, apoi plătești lunar doar pentru utilizatorii care acceptă invitațiile și intră în companie.",
    "per active user": "per utilizator activ",
    "when invitees join or users are removed":
      "când invitații se alătură sau utilizatorii sunt eliminați",
    "We are confirming your subscription and preparing your admin account.":
      "Confirmăm abonamentul și pregătim contul de administrator.",
    "We could not complete signup": "Nu am putut finaliza înregistrarea",
    "Your subscription is not active. Fix billing before inviting users.":
      "Abonamentul nu este activ. Rezolvă facturarea înainte de a invita utilizatori.",
    "Your subscription is not active. Operational changes are paused until billing is fixed.":
      "Abonamentul nu este activ. Modificările operaționale sunt suspendate până la rezolvarea facturării.",
    "Your subscription starts at €3 per active user each month after checkout.":
      "Abonamentul începe după checkout la 3 € pe utilizator activ pe lună.",
    "€3 per active user each month": "3 € pe utilizator activ în fiecare lună",
    "+{count} more": "+ încă {count}",
    "Active": "Activ",
    "Active workpoints": "Puncte de lucru active",
    "Assigned": "Alocați",
    "Current check-ins": "Intrări curente",
    "Display mode": "Mod afișaj",
    "Exit display": "Ieși din afișaj",
    "Failed to load Live Follow.": "Monitorizarea live nu a putut fi încărcată.",
    "Inactive": "Inactiv",
    "Latest auto checkout": "Ultima ieșire automată",
    "Live Follow": "Monitorizare live",
    "Live socket connected": "Conexiune live activă",
    "No recent activity": "Nu există activitate recentă",
    "No workers checked in": "Niciun muncitor înregistrat",
    "Open over 10h": "Deschis peste 10h",
    "Polling fallback": "Actualizare prin polling",
    "Recent events": "Evenimente recente",
    "Refreshing": "Se reîmprospătează",
    "Updated": "Actualizat",
    "Warning": "Avertizare",
    "Warnings": "Avertizări",
    "Workers checked in": "Muncitori prezenți",
    "Back to sign in": "Înapoi la autentificare",
    "Choose a new password for your Strulix account.":
      "Alege o parolă nouă pentru contul tău Strulix.",
    "Choose how Strulix looks on this device.":
      "Alege cum arată Strulix pe acest dispozitiv.",
    "Choose the language used across the app.":
      "Alege limba folosită în aplicație.",
    "Enter your email and we will send a password reset link.":
      "Introdu emailul și îți vom trimite un link de resetare a parolei.",
    "Forgot password?": "Ai uitat parola?",
    "If an account exists, we sent a password reset link.":
      "Dacă există un cont, am trimis un link de resetare a parolei.",
    "Language": "Limbă",
    "Manage your account preferences and workspace settings.":
      "Gestionează preferințele contului și setările spațiului de lucru.",
    "New password": "Parolă nouă",
    "Password reset failed": "Resetarea parolei a eșuat",
    "Password reset link is invalid or expired.":
      "Linkul de resetare a parolei este invalid sau expirat.",
    "Password reset token is required.":
      "Tokenul de resetare a parolei este obligatoriu.",
    "Profile": "Profil",
    "Reset password": "Resetează parola",
    "Send reset link": "Trimite linkul de resetare",
    "Settings": "Setări",
    "Theme": "Temă",
    "Update password": "Actualizează parola",
    "Updating…": "Se actualizează…",
    "Your password has been updated. You can sign in with the new password.":
      "Parola a fost actualizată. Te poți autentifica folosind noua parolă.",
  },
  hu: {
    "ADMIN": "Adminisztrátor",
    "ACCEPTED": "Elfogadva",
    "Address": "Cím",
    "Actions": "Műveletek",
    "Already completed today": "Ma már lezárva",
    "Already have an account?": "Már van fiókod?",
    "All workpoints": "Összes munkapont",
    "Allow camera access to scan attendance.":
      "Engedélyezd a kamera használatát a jelenlét rögzítéséhez.",
    "Allow location access to scan attendance.":
      "Engedélyezd a helyhozzáférést a jelenlét rögzítéséhez.",
    "Ask an admin to set your wage":
      "Kérj meg egy adminisztrátort, hogy állítsa be a béredet",
    "Attendance": "Jelenlét",
    "Attendance by workpoint": "Jelenlét munkapontonként",
    "Attendance days": "Jelenléti napok",
    "Attendance scan": "Jelenlét szkennelése",
    "Auto": "Auto",
    "Auto-closed": "Automatikusan zárva",
    "Automatically closed at 22:00": "Automatikusan zárva 22:00-kor",
    "Browse your job sites and open one to manage its workers, attendance, and QR tools.":
      "Böngéssz a munkaterületeid között, és nyiss meg egyet a dolgozók, a jelenlét és a QR-eszközök kezelésére.",
    "Camera scanning requires HTTPS.":
      "A kamera szkenneléshez HTTPS szükséges.",
    "Cancel": "Mégse",
    "Change language": "Nyelvváltás",
    "Checked in": "Belépés rögzítve",
    "Checked out": "Kilépés rögzítve",
    "Complete": "Lezárt",
    "Completed attendances only": "Csak a lezárt jelenlétek",
    "Company name": "Cég neve",
    "Company name is required.": "A cég neve kötelező.",
    "Construction operations for teams in motion":
      "Építőipari műveletek mozgásban lévő csapatoknak",
    "Coordinate workpoints, QR attendance, worker documents, leave requests, and team messaging in one focused construction operations system.":
      "Koordináld a munkapontokat, QR-jelenlétet, dolgozói dokumentumokat, szabadságkérelmeket és csapatüzeneteket egy célzott építőipari műveleti rendszerben.",
    "Configured on your worker profile": "A dolgozói profilodon beállítva",
    "Coordinates are generated automatically from the address.":
      "A koordináták automatikusan készülnek a címből.",
    "Copied!": "Másolva!",
    "Copy invite link": "Meghívó link másolása",
    "Create account": "Fiók létrehozása",
    "Create first administrator": "Első adminisztrátor létrehozása",
    "Create the first company administrator":
      "Az első céges adminisztrátor létrehozása",
    "Create workpoint": "Munkapont létrehozása",
    "Create your account": "Hozd létre a fiókodat",
    "Creating account…": "Fiók létrehozása folyamatban…",
    "Current workpoints assigned to you.":
      "A jelenleg hozzád rendelt munkapontok.",
    "Dark theme": "Sötét téma",
    "Date": "Dátum",
    "Click a start date, then an end date.":
      "Kattints egy kezdő dátumra, majd egy végdátumra.",
    "Days": "Napok",
    "Mon": "Hét",
    "Tue": "Ked",
    "Wed": "Sze",
    "Thu": "Csü",
    "Fri": "Pén",
    "Sat": "Szo",
    "Sun": "Vas",
    "Deadline": "Határidő",
    "Delete": "Törlés",
    "Delete workpoint": "Munkapont törlése",
    "Description": "Leírás",
    "Documents": "Dokumentumok",
    "Done": "Kész",
    "Download": "Letöltés",
    "Download document": "Dokumentum letöltése",
    "Earnings": "Kereset",
    "Edit workpoint": "Munkapont szerkesztése",
    "Email": "Email",
    "Email address": "Email cím",
    "Email is locked to the invited address.":
      "Az email-cím a meghívott címre van rögzítve.",
    "Email is required.": "Az email cím kötelező.",
    "Please enter a valid email address.":
      "Adj meg egy érvényes email-címet.",
    "Email must be at most 254 characters.":
      "Az email cím legfeljebb 254 karakter lehet.",
    "EXPIRED": "Lejárt",
    "Expires": "Lejár",
    "Failed to load invitations.":
      "A meghívók betöltése nem sikerült.",
    "Failed to load workpoints.":
      "A munkapontok betöltése nem sikerült.",
    "Failed to load your documents.":
      "A dokumentumok betöltése nem sikerült.",
    "Failed to load your worker dashboard.":
      "A dolgozói áttekintés betöltése nem sikerült.",
    "Failed to save workpoint": "A munkapont mentése nem sikerült",
    "Failed to send invitation": "A meghívó küldése nem sikerült",
    "File": "Fájl",
    "Home": "Kezdőlap",
    "Hourly wage": "Órabér",
    "Hours": "Órák",
    "Image": "Kép",
    "Invalid date": "Érvénytelen dátum",
    "Invalid QR code.": "Érvénytelen QR-kód.",
    "Invitations": "Meghívók",
    "Invite a new user": "Új felhasználó meghívása",
    "Invite new users by email. Each invitation carries a role and a one-time registration link.":
      "Hívj meg új felhasználókat emailben. Minden meghívóhoz szerepkör és egyszer használható regisztrációs link tartozik.",
    "Invite leaders and workers, keep roles clear, and organize communication around real work.":
      "Hívj meg vezetőket és dolgozókat, tartsd tisztán a szerepeket, és szervezd a kommunikációt a valós munka köré.",
    "Join the Construction ERP system":
      "Csatlakozz az építőipari ERP rendszerhez",
    "LEADER": "Csapatvezető",
    "Leader": "Csapatvezető",
    "Light theme": "Világos téma",
    "Leave and documents": "Szabadságok és dokumentumok",
    "Location timed out. Move somewhere with a clearer signal and try again.":
      "A helymeghatározás időtúllépéssel leállt. Menj jobb jelű helyre, és próbáld újra.",
    "Location access requires HTTPS.":
      "A helyhozzáféréshez HTTPS szükséges.",
    "Location is required to record attendance at this workpoint.":
      "A jelenlét rögzítéséhez helyadat szükséges ezen a munkaponton.",
    "Location is still blocked by the browser or device. Allow location for this site and for the browser app, then scan the QR code again.":
      "A helyadatot még mindig blokkolja a böngésző vagy az eszköz. Engedélyezd a helyhozzáférést ehhez a webhelyhez és a böngésző alkalmazáshoz, majd szkenneld be újra a QR-kódot.",
    "Location required": "Helyadat szükséges",
    "Are you sure you want to log out?":
      "Biztosan ki szeretnél jelentkezni?",
    "Ask your company administrator for an invitation.":
      "Kérj meghívót a céges adminisztrátortól.",
    "Handle leave requests, worker files, and workpoint documents without spreadsheet drift.":
      "Kezeld a szabadságkérelmeket, dolgozói fájlokat és munkapont-dokumentumokat táblázatos szétesés nélkül.",
    "Log out": "Kijelentkezés",
    "Login": "Bejelentkezés",
    "Login failed": "A belépés sikertelen",
    "Messages": "Üzenetek",
    "Missing check-out": "Hiányzó kilépés",
    "Month": "Hónap",
    "Monthly earnings": "Havi kereset",
    "Must start with an uppercase letter and be at least 6 characters.":
      "Nagybetűvel kell kezdődnie, és legalább 6 karakterből kell állnia.",
    "Name": "Név",
    "Name and address are required.": "A név és a cím kötelező.",
    "Network error. Please try again.":
      "Hálózati hiba. Próbáld újra.",
    "Need access?": "Hozzáférésre van szükséged?",
    "New company registration will open after payment is available. For now, use an invitation link or request access.":
      "Az új cégek regisztrációja a fizetés elérhetősége után nyílik meg. Addig használj meghívó linket, vagy kérj hozzáférést.",
    "For first-time setup on an empty database, use the bootstrap registration flow.":
      "Első beállításkor üres adatbázisnál használd a bootstrap regisztrációs folyamatot.",
    "New workpoint": "Új munkapont",
    "No account?": "Nincs fiókod?",
    "No attendance recorded here for {periodLabel}.":
      "Itt nincs rögzített jelenlét erre: {periodLabel}.",
    "No attendance records for {periodLabel}.":
      "Nincsenek jelenléti adatok erre: {periodLabel}.",
    "No camera was found on this device.":
      "Nem található kamera ezen az eszközön.",
    "No documents have been shared with you yet.":
      "Még nem osztottak meg veled dokumentumokat.",
    "No invitations yet. Use the form above to invite your first user.":
      "Még nincsenek meghívók. A fenti űrlappal hívhatod meg az első felhasználót.",
    "No workers available.": "Nincs elérhető dolgozó.",
    "No workpoints are assigned to you yet.":
      "Még nincs hozzád rendelt munkapont.",
    "No workpoints yet. Create one to start tracking attendance.":
      "Még nincsenek munkapontok. Hozz létre egyet a jelenlét követéséhez.",
    "Not set": "Nincs beállítva",
    "Open": "Megnyitás",
    "Open records": "Nyitott bejegyzések",
    "Open workpoint": "Munkapont megnyitása",
    "PENDING": "Függőben",
    "Password": "Jelszó",
    "Password must start with an uppercase letter and be at least 6 characters.":
      "A jelszónak nagybetűvel kell kezdődnie, és legalább 6 karakteresnek kell lennie.",
    "Password must start with an uppercase letter.":
      "A jelszónak nagybetűvel kell kezdődnie.",
    "Password must be at least 6 characters.":
      "A jelszónak legalább 6 karakteresnek kell lennie.",
    "Password must be at most 100 characters.":
      "A jelszó legfeljebb 100 karakter lehet.",
    "Password is required.": "A jelszó kötelező.",
    "PDF": "PDF",
    "Pending": "Függőben",
    "Pending leave": "Függő szabadság",
    "Plan and manage job sites, assigned workers, documents, and daily attendance from one place.":
      "Tervezd és kezeld a munkaterületeket, hozzárendelt dolgozókat, dokumentumokat és napi jelenlétet egy helyről.",
    "Place the attendance QR code inside the frame.":
      "Helyezd a jelenléti QR-kódot a keretbe.",
    "Please enter a username and password.":
      "Adj meg egy felhasználónevet és egy jelszót.",
    "Point the camera at the attendance QR code.":
      "Irányítsd a kamerát a jelenléti QR-kódra.",
    "Preparing scan": "Szkennelés előkészítése",
    "Previous": "Korábbi",
    "Previous month": "Előző hónap",
    "Next month": "Következő hónap",
    "Previous workpoint": "Korábbi munkapont",
    "Preview and download documents shared with your worker profile.":
      "Tekintsd meg és töltsd le a dolgozói profilodhoz megosztott dokumentumokat.",
    "Preview is not available for this document.":
      "Ehhez a dokumentumhoz nem érhető el előnézet.",
    "QR attendance": "QR-jelenlét",
    "Record attendance": "Jelenlét rögzítése",
    "Recording attendance...": "Jelenlét rögzítése folyamatban...",
    "Register": "Regisztráció",
    "Registration is invite-only": "A regisztráció csak meghívóval érhető el",
    "Registration is invite-only until payment is available.":
      "A regisztráció a fizetés elérhetőségéig csak meghívóval működik.",
    "Registration failed": "A regisztráció sikertelen",
    "Request access": "Hozzáférés kérése",
    "Username already taken": "Ez a felhasználónév már foglalt.",
    "Username must be at most 50 characters.":
      "A felhasználónév legfeljebb 50 karakter lehet.",
    "An invitation token is required to register":
      "A regisztrációhoz meghívó token szükséges.",
    "Invitation is invalid, expired, or does not match this email":
      "A meghívó érvénytelen, lejárt, vagy nem ehhez az email címhez tartozik.",
    "Invitation token cannot be empty.":
      "A meghívó token nem lehet üres.",
    "Invitation token is too long.":
      "A meghívó token túl hosszú.",
    "Enable location": "Hely engedélyezése",
    "REVOKED": "Visszavonva",
    "Revoke invitation": "Meghívó visszavonása",
    "Role": "Szerepkör",
    "Save": "Mentés",
    "Saving...": "Mentés folyamatban...",
    "Scan a Strulix attendance QR code.":
      "Szkennelj be egy Strulix jelenléti QR-kódot.",
    "Scan attendance": "Jelenlét szkennelése",
    "Scan QR": "QR szkennelése",
    "Scan result": "Szkennelés eredménye",
    "Select a document to preview it.":
      "Válassz ki egy dokumentumot az előnézethez.",
    "Send invitation": "Meghívó küldése",
    "Sending…": "Küldés…",
    "Sent": "Elküldve",
    "Sign in": "Belépés",
    "Signing in…": "Belépés folyamatban…",
    "Starting camera...": "Kamera indítása...",
    "Status": "Állapot",
    "This attendance was already completed for today.":
      "Ez a jelenlét már le lett zárva mára.",
    "This attendance was automatically closed at 22:00 and may need review.":
      "Ez a jelenlét automatikusan lezárult 22:00-kor, és ellenőrzésre szorulhat.",
    "This browser cannot provide location for attendance scans.":
      "Ez a böngésző nem tud helyadatot adni a jelenlét szkenneléshez.",
    "Team operations": "Csapatműveletek",
    "Total hours": "Összes óra",
    "Track your assigned workpoints, attendance, hours, and wage-based earnings for {periodLabel}.":
      "Kövesd a hozzád rendelt munkapontokat, a jelenlétet, az órákat és a béralapú kereseteket ehhez: {periodLabel}.",
    "Try again": "Próbáld újra",
    "Use your current location to record attendance at this workpoint.":
      "Használd az aktuális helyzetedet a jelenlét rögzítéséhez ezen a munkaponton.",
    "Unable to get your current location. Check location services and try again.":
      "Nem sikerült meghatározni a jelenlegi helyzetedet. Ellenőrizd a helymeghatározást, és próbáld újra.",
    "Unable to record attendance.":
      "A jelenlét rögzítése nem sikerült.",
    "Unable to start the camera scanner.":
      "A kamera szkennelő indítása nem sikerült.",
    "Unavailable": "Nem érhető el",
    "Uploaded {date}": "Feltöltve: {date}",
    "User Invitations": "Felhasználói meghívók",
    "Username": "Felhasználónév",
    "Username must be at least 3 characters.":
      "A felhasználónévnek legalább 3 karakteresnek kell lennie.",
    "Users": "Felhasználók",
    "Welcome back to Strulix": "Üdvözöl újra a Strulix-ban",
    "Workpoint": "Munkapont",
    "Workpoints": "Munkapontok",
    "WORKER": "Munkás",
    "Worker": "Munkás",
    "Worker dashboard": "Dolgozói áttekintés",
    "Worker management": "Dolgozók kezelése",
    "Workers": "Dolgozók",
    "Workers scan on site while managers review hours, missing check-outs, and Excel exports.":
      "A dolgozók a helyszínen szkennelnek, miközben a vezetők ellenőrzik az órákat, hiányzó kilépéseket és Excel-exportokat.",
    "Workpoint control": "Munkapont-irányítás",
    "Your company": "A céged",
    "Your Strulix home": "A Strulix kezdőlapod",
    "Your documents": "Saját dokumentumok",
    "Your own check-ins and check-outs for {periodLabel}.":
      "A saját belépéseid és kilépéseid a(z) {periodLabel} időszakban.",
    "You're accepting an invitation. Your role will be assigned automatically.":
      "Egy meghívót fogadsz el. A szerepköröd automatikusan be lesz állítva.",
    "Add": "Hozzáad",
    "Add a check-in and optional check-out for a worker.":
      "Adj hozzá egy belépést és opcionális kilépést egy dolgozóhoz.",
    "Attachment": "Melléklet",
    "Automatically closed at 22:00. Edit to mark reviewed.":
      "Automatikusan lezárva 22:00-kor. Szerkeszd az ellenőrzöttként jelöléshez.",
    "Strulix": "Strulix",
    "Strulix logo": "Strulix logo",
    "Strulix keeps field work, office review, and worker self-service connected without adding another messy spreadsheet.":
      "A Strulix összeköti a terepi munkát, az irodai ellenőrzést és a dolgozói önkiszolgálást egy újabb rendezetlen táblázat nélkül.",
    "Bootstrap registration only works when it is enabled on the API and no company exists yet.":
      "A bootstrap regisztráció csak akkor működik, ha engedélyezve van az API-ban, és még nem létezik cég.",
    "Built for the daily rhythm of construction work":
      "Az építőipari munka napi ritmusára építve",
    "by {name}": "{name} által",
    "Check in": "Belépés",
    "Check out": "Kilépés",
    "Check-in time": "Belépés ideje",
    "Check-out time": "Kilépés ideje",
    "Choose a conversation from the list or start a new one.":
      "Válassz egy beszélgetést a listából, vagy indíts egy újat.",
    "Choose worker": "Válassz dolgozót",
    "Close": "Bezár",
    "Close notification": "Értesítés bezárása",
    "Conversations": "Beszélgetések",
    "Created": "Létrehozva",
    "Delete attendance": "Jelenlét törlése",
    "Delete attendance for {name}?": "Töröljük {name} jelenlétét?",
    "Delete worker": "Dolgozó törlése",
    "Delete {name}?": "Töröljük {name}?",
    "Delete document": "Dokumentum törlése",
    "Deleting…": "Törlés...",
    "Displays the mobile sidebar.": "Megjeleníti a mobil oldalsávot.",
    "Documents for {name}": "Dokumentumok: {name}",
    "Download QR": "QR letöltése",
    "Edit attendance hours": "Jelenléti órák szerkesztése",
    "Edit hours": "Órák szerkesztése",
    "Edit worker": "Dolgozó szerkesztése",
    "e.g. 35.50": "pl. 35.50",
    "Export": "Export",
    "Failed to add attendance": "A jelenlét hozzáadása nem sikerült.",
    "Failed to load this workpoint.": "A munkapont betöltése nem sikerült.",
    "Failed to load workpoint documents.":
      "A munkapont dokumentumainak betöltése nem sikerült.",
    "Failed to update attendance hours": "A jelenléti órák frissítése nem sikerült.",
    "Failed to update worker": "A dolgozó frissítése nem sikerült.",
    "Failed to upload document": "A dokumentum feltöltése nem sikerült.",
    "Filter records and export the same period to Excel.":
      "Szűrd a bejegyzéseket, és exportáld ugyanezt az időszakot Excelbe.",
    "From": "Tól",
    "h": "h",
    "Hourly wage (RON)": "Órabér (RON)",
    "KB": "KB",
    "MB": "MB",
    "Manual attendance": "Manuális jelenlét",
    "Manual mark": "Manuális jelölés",
    "Manage attendance, QR access, documents, and exports for this site.":
      "Kezeld a jelenlétet, a QR-hozzáférést, a dokumentumokat és az exportokat ezen a helyen.",
    "Manage registered workers and their documents.":
      "Kezeld a regisztrált dolgozókat és dokumentumaikat.",
    "Manage worker documents": "Dolgozói dokumentumok kezelése",
    "Messaging": "Üzenetküldés",
    "New conversation": "Új beszélgetés",
    "No attendance records for this period.":
      "Nincsenek jelenléti adatok erre az időszakra.",
    "No conversation selected": "Nincs kiválasztott beszélgetés",
    "No conversations match your search.":
      "Nincs a kereséssel egyező beszélgetés.",
    "No conversations yet.": "Még nincs beszélgetés.",
    "No messages yet": "Még nincs üzenet",
    "No documents uploaded for this worker.":
      "Ehhez a dolgozóhoz még nincs feltöltött dokumentum.",
    "No documents uploaded for this workpoint.":
      "Ehhez a munkaponthoz még nincs feltöltött dokumentum.",
    "No users found": "Nem található felhasználó",
    "No wage": "Nincs bér",
    "No workers have checked in to this workpoint yet.":
      "Még egy dolgozó sem jelentkezett be ezen a munkaponton.",
    "No workers registered yet.": "Még nincs regisztrált dolgozó.",
    "Offline": "Offline",
    "Online": "Online",
    "Preview document": "Dokumentum előnézete",
    "QR check-in": "QR check-in",
    "QR code is not available yet.": "A QR-kód még nem elérhető.",
    "Records": "Bejegyzések",
    "Rotate": "Forgatás",
    "Rotate this QR code? Existing printed codes will stop working.":
      "Elforgatod ezt a QR-kódot? A korábbi nyomtatott kódok már nem fognak működni.",
    "Search conversations…": "Beszélgetések keresése…",
    "Search users...": "Felhasználók keresése...",
    "Sidebar": "Oldalsáv",
    "Source": "Forrás",
    "That workpoint could not be found.": "Ez a munkapont nem található.",
    "Toggle Sidebar": "Oldalsáv be-/kikapcsolása",
    "To": "Ig",
    "Upload": "Feltöltés",
    "Worker documents": "Dolgozói dokumentumok",
    "Workpoint check-in QR code": "Munkaponti check-in QR-kód",
    "Workpoint details": "Munkapont részletei",
    "Workpoint documents": "Munkapont dokumentumai",
    "Write a message… (Enter to send, Shift+Enter for newline)":
      "Írj üzenetet… (Enter küldéshez, Shift+Enter új sorhoz)",
    "Leave Calendar": "Szabadságnaptár",
    "Select a leave period directly on the calendar.":
      "Válassz ki egy szabadságidőszakot közvetlenül a naptárban.",
    "Review employee leave requests and approved absences.":
      "Nézd át a dolgozók szabadságkérelmeit és a jóváhagyott távolléteket.",
    "Failed to load leave requests.":
      "A szabadságkérelmek betöltése nem sikerült.",
    "You cannot select past dates.": "Nem választhatsz múltbeli dátumokat.",
    "End date cannot be before start date":
      "A befejező dátum nem lehet korábban, mint a kezdő dátum.",
    "This period overlaps with an existing request.":
      "Ez az időszak átfedésben van egy meglévő kérelemmel.",
    "Please select a start and end date.":
      "Kérlek, válassz kezdő- és végdátumot.",
    "Please choose a leave type.": "Kérlek, válassz szabadságtípust.",
    "Leave request submitted.": "A szabadságkérelmet elküldtük.",
    "User not found": "A felhasználó nem található.",
    "Admins cannot create leave requests":
      "Az adminisztrátorok nem hozhatnak létre szabadságkérelmeket.",
    "Only admins and leaders can review requests":
      "Csak adminisztrátorok és csapatvezetők bírálhatnak el kérelmeket.",
    "Failed to submit leave request.":
      "A szabadságkérés elküldése nem sikerült.",
    "Leave request approved.": "A szabadságkérelem jóváhagyva.",
    "Leave request not found": "A szabadságkérelem nem található.",
    "You cannot review your own leave request":
      "Nem bírálhatod el a saját szabadságkérelmedet.",
    "Only pending requests can be reviewed":
      "Csak függőben lévő kérelmek bírálhatók el.",
    "Failed to approve leave request.":
      "A szabadságkérelem jóváhagyása nem sikerült.",
    "Leave request rejected.": "A szabadságkérelem elutasítva.",
    "Failed to reject leave request.":
      "A szabadságkérelem elutasítása nem sikerült.",
    "Cancel this pending request?": "Töröljük ezt a függőben lévő kérelmet?",
    "Leave request canceled.": "A szabadságkérelem törölve.",
    "You can only cancel your own requests":
      "Csak a saját kérelmeidet törölheted.",
    "Only pending requests can be canceled":
      "Csak függőben lévő kérelmek törölhetők.",
    "Failed to cancel leave request.":
      "A szabadságkérelem törlése nem sikerült.",
    "Approved leave is highlighted on the calendar.":
      "A jóváhagyott szabadság ki van emelve a naptárban.",
    "Vacation leave": "Szabadság",
    "Sick leave": "Betegszabadság",
    "Leave type": "Szabadság típusa",
    "Choose leave type": "Válassz szabadságtípust",
    "Selected period": "Kiválasztott időszak",
    "Not selected": "Nincs kiválasztva",
    "Start date": "Kezdő dátum",
    "End date": "Végdátum",
    "Submitting...": "Küldés folyamatban...",
    "Submit request": "Kérelem küldése",
    "Clear": "Törlés",
    "Pending approvals": "Függőben lévő jóváhagyások",
    "Requests waiting for a manager decision.":
      "A vezető döntésére váró kérelmek.",
    "No pending requests.": "Nincsenek függőben lévő kérelmek.",
    "All leave requests": "Összes szabadságkérés",
    "Your leave requests": "Saját szabadságkérelmeid",
    "Approved and rejected requests stay visible here.":
      "A jóváhagyott és elutasított kérelmek itt maradnak.",
    "Track your submitted leave requests and approval status.":
      "Kövesd a beküldött szabadságkérelmeket és a jóváhagyás státuszát.",
    "No reviewed leave requests yet.": "Még nincsenek elbírált kérelmek.",
    "No leave requests yet.": "Még nincsenek szabadságkérelmek.",
    "Approved": "Jóváhagyva",
    "Rejected": "Elutasítva",
    "Submitted": "Beküldve",
    "Approve": "Jóváhagy",
    "Reject": "Elutasít",
    "Cancel request": "Kérelem törlése",
    "{count} days": "{count} nap",
    "you@example.com": "te@example.com",
    "your.username": "felhasználónév",
    "user@example.com": "felhasználó@example.com",
    "{amount} RON/h": "{amount} RON/h",
    "{count} members": "{count} tag",
    "now": "most",
    "Loading": "Betöltés",
    "B": "B",
    "GB": "GB",
    "{count} complete": "{count} lezárt",
    "{count} complete days": "{count} teljes nap",
    "{count} records": "{count} bejegyzés",
    "ACTIVE": "Aktív",
    "TRIALING": "Próbaidőszak",
    "UNPAID": "Nincs fizetve",
    "PAST_DUE": "Lejárt fizetés",
    "CANCELED": "Lemondva",
    "Active users": "Aktív felhasználók",
    "Automatic": "Automatikus",
    "Billing": "Számlázás",
    "Billing attention needed": "Számlázási teendő szükséges",
    "Billing is required to continue.":
      "A folytatáshoz rendezett számlázás szükséges.",
    "Strulix updates Stripe when invited users accept or when users are removed, including prorated monthly changes.":
      "A Strulix frissíti a Stripe-ot, amikor a meghívott felhasználók csatlakoznak vagy felhasználókat törölnek, beleértve az időarányos havi módosításokat.",
    "Checkout session is required.": "A checkout munkamenet kötelező.",
    "Completing your signup": "A regisztráció befejezése",
    "Continue to payment": "Tovább a fizetéshez",
    "Create your company workspace": "Céges munkaterület létrehozása",
    "Current period ends {date}": "Az aktuális időszak vége: {date}",
    "Current status": "Aktuális állapot",
    "Failed to complete paid registration":
      "A fizetett regisztrációt nem sikerült befejezni",
    "Failed to load billing status.":
      "Nem sikerült betölteni a számlázási állapotot.",
    "Failed to start checkout": "Nem sikerült elindítani a checkoutot",
    "Manage billing": "Számlázás kezelése",
    "Manage your Strulix subscription and user-based billing.":
      "Kezeld a Strulix előfizetést és a felhasználóalapú számlázást.",
    "Monthly price": "Havi ár",
    "New companies can start with paid signup. Invited users should use their invitation link.":
      "Az új cégek fizetett regisztrációval indulhatnak. A meghívott felhasználók használják a meghívólinkjüket.",
    "No current billing period is available.":
      "Nincs elérhető aktuális számlázási időszak.",
    "No payment provider": "Nincs fizetési szolgáltató",
    "Opening checkout…": "Checkout megnyitása…",
    "Operational changes are paused until billing is fixed.":
      "Az operatív módosítások szünetelnek, amíg a számlázás nincs rendezve.",
    "Paid seats": "Fizetett helyek",
    "Seat updates": "Helyek frissítése",
    "secure checkout and tax handling":
      "biztonságos checkout és adókezelés",
    "Simple per-user billing": "Egyszerű felhasználóalapú számlázás",
    "Start for €3/user/month": "Indítás 3 €/felhasználó/hó áron",
    "Start paid signup": "Fizetett regisztráció indítása",
    "Start with one admin seat, then pay monthly only for users who accept invitations and join your company.":
      "Egy adminisztrátori hellyel indulsz, majd havonta csak azokért fizetsz, akik elfogadják a meghívást és csatlakoznak a céghez.",
    "per active user": "aktív felhasználónként",
    "when invitees join or users are removed":
      "amikor meghívottak csatlakoznak vagy felhasználókat törölnek",
    "We are confirming your subscription and preparing your admin account.":
      "Ellenőrizzük az előfizetést és előkészítjük az admin fiókodat.",
    "We could not complete signup": "Nem sikerült befejezni a regisztrációt",
    "Your subscription is not active. Fix billing before inviting users.":
      "Az előfizetés nem aktív. Rendezd a számlázást, mielőtt felhasználókat hívsz meg.",
    "Your subscription is not active. Operational changes are paused until billing is fixed.":
      "Az előfizetés nem aktív. Az operatív módosítások szünetelnek, amíg a számlázás nincs rendezve.",
    "Your subscription starts at €3 per active user each month after checkout.":
      "Az előfizetés checkout után havi 3 € aktív felhasználónként.",
    "€3 per active user each month": "3 € aktív felhasználónként havonta",
    "+{count} more": "+ még {count}",
    "Active": "Aktív",
    "Active workpoints": "Aktív munkapontok",
    "Assigned": "Hozzárendelve",
    "Current check-ins": "Aktuális belépések",
    "Display mode": "Kijelző mód",
    "Exit display": "Kilépés kijelzőből",
    "Failed to load Live Follow.": "Az élő követés betöltése sikertelen.",
    "Inactive": "Inaktív",
    "Latest auto checkout": "Legutóbbi automatikus kilépés",
    "Live Follow": "Élő követés",
    "Live socket connected": "Élő kapcsolat aktív",
    "No recent activity": "Nincs friss aktivitás",
    "No workers checked in": "Nincs belépett dolgozó",
    "Open over 10h": "Több mint 10 órája nyitott",
    "Polling fallback": "Polling tartalék",
    "Recent events": "Legutóbbi események",
    "Refreshing": "Frissítés",
    "Updated": "Frissítve",
    "Warning": "Figyelmeztetés",
    "Warnings": "Figyelmeztetések",
    "Workers checked in": "Belépett dolgozók",
    "Back to sign in": "Vissza a bejelentkezéshez",
    "Choose a new password for your Strulix account.":
      "Válassz új jelszót a Strulix fiókodhoz.",
    "Choose how Strulix looks on this device.":
      "Válaszd ki, hogyan jelenjen meg a Strulix ezen az eszközön.",
    "Choose the language used across the app.":
      "Válaszd ki az alkalmazás nyelvét.",
    "Enter your email and we will send a password reset link.":
      "Add meg az emailed, és elküldjük a jelszó-visszaállító linket.",
    "Forgot password?": "Elfelejtetted a jelszavad?",
    "If an account exists, we sent a password reset link.":
      "Ha létezik fiók, elküldtük a jelszó-visszaállító linket.",
    "Language": "Nyelv",
    "Manage your account preferences and workspace settings.":
      "Kezeld a fiókbeállításaidat és a munkaterület beállításait.",
    "New password": "Új jelszó",
    "Password reset failed": "A jelszó-visszaállítás sikertelen",
    "Password reset link is invalid or expired.":
      "A jelszó-visszaállító link érvénytelen vagy lejárt.",
    "Password reset token is required.":
      "A jelszó-visszaállító token kötelező.",
    "Profile": "Profil",
    "Reset password": "Jelszó visszaállítása",
    "Send reset link": "Visszaállító link küldése",
    "Settings": "Beállítások",
    "Theme": "Téma",
    "Update password": "Jelszó frissítése",
    "Updating…": "Frissítés…",
    "Your password has been updated. You can sign in with the new password.":
      "A jelszavad frissült. Bejelentkezhetsz az új jelszóval.",
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
