import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'app_scope.dart';
import 'formatters.dart';

enum AppLanguage {
  english('en', 'English'),
  romanian('ro', 'Romana'),
  hungarian('hu', 'Magyar');

  const AppLanguage(this.code, this.label);

  final String code;
  final String label;

  Locale get locale => Locale(code);

  static AppLanguage fromLocale(Locale locale) {
    return switch (locale.languageCode) {
      'ro' => AppLanguage.romanian,
      'hu' => AppLanguage.hungarian,
      _ => AppLanguage.english,
    };
  }
}

const supportedAppLocales = <Locale>[
  Locale('en'),
  Locale('ro'),
  Locale('hu'),
];

const appLocalizationsDelegates = <LocalizationsDelegate<dynamic>>[
  GlobalMaterialLocalizations.delegate,
  GlobalWidgetsLocalizations.delegate,
  GlobalCupertinoLocalizations.delegate,
];

class LanguageController extends ChangeNotifier {
  LanguageController({Locale? systemLocale})
    : _language = AppLanguage.fromLocale(
        systemLocale ?? PlatformDispatcher.instance.locale,
      ) {
    _syncFormatters();
  }

  AppLanguage _language;

  AppLanguage get language => _language;
  Locale get locale => _language.locale;

  String t(String key, [Map<String, String>? params]) {
    return _translate(_language, key, params);
  }

  String roleLabel(String role) => t(role.toUpperCase());

  String invitationStatusLabel(String status) => t(status.toUpperCase());

  void setLanguage(AppLanguage language) {
    if (_language == language) return;
    _language = language;
    _syncFormatters();
    notifyListeners();
  }

  void _syncFormatters() {
    _activeLanguage = _language;
    configureFormatters(locale: _language.code, translate: t);
  }
}

class AppLanguageMenuButton extends StatelessWidget {
  const AppLanguageMenuButton({super.key});

  @override
  Widget build(BuildContext context) {
    final language = AppScope.languageOf(context);

    return PopupMenuButton<AppLanguage>(
      tooltip: language.t('Change language'),
      icon: const Icon(Icons.translate),
      onSelected: language.setLanguage,
      itemBuilder: (context) => AppLanguage.values
          .map(
            (value) => PopupMenuItem<AppLanguage>(
              value: value,
              child: Row(
                children: [
                  if (language.language == value)
                    const Padding(
                      padding: EdgeInsets.only(right: 8),
                      child: Icon(Icons.check, size: 18),
                    )
                  else
                    const SizedBox(width: 26),
                  Text(value.label),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

extension BuildContextI18n on BuildContext {
  LanguageController get l10n => AppScope.languageOf(this);
}

final Map<AppLanguage, Map<String, String>> _messages = {
  AppLanguage.english: {
    'Address': 'Address',
    'Address is required.': 'Address is required.',
    'Already have an account? Sign in': 'Already have an account? Sign in',
    'Allow location access to scan attendance.':
        'Allow location access to scan attendance.',
    'Ask an admin to set your wage': 'Ask an admin to set your wage',
    'Attendance': 'Attendance',
    'Attendance scan': 'Attendance scan',
    'Attendance, hours, assigned workpoints, and wage-based earnings.':
        'Attendance, hours, assigned workpoints, and wage-based earnings.',
    'ACCEPTED': 'Accepted',
    'Checked in': 'Checked in',
    'Checked in at': 'Checked in at',
    'Checked out': 'Checked out',
    'Check-ins and check-outs': 'Check-ins and check-outs',
    'Change language': 'Change language',
    'Choose deadline': 'Choose deadline',
    'Cancel': 'Cancel',
    'Completed attendances': 'Completed attendances',
    'Confirm': 'Confirm',
    'Coordinates are generated automatically from the address.':
        'Coordinates are generated automatically from the address.',
    'Copy link': 'Copy link',
    'Create account': 'Create account',
    'Creating account...': 'Creating account...',
    'Create workpoint': 'Create workpoint',
    'Create your account': 'Create your account',
    'Created {date}': 'Created {date}',
    'Current workpoints assigned to you.':
        'Current workpoints assigned to you.',
    'Dark theme': 'Dark theme',
    'Date': 'Date',
    'Days': 'Days',
    'Deadline': 'Deadline',
    'Deadline {date}': 'Deadline {date}',
    'Delete': 'Delete',
    'Delete workpoint': 'Delete workpoint',
    'Delete {name}? Attendance, assignments, and the workpoint chat will be removed.':
        'Delete {name}? Attendance, assignments, and the workpoint chat will be removed.',
    'Description': 'Description',
    'Documents': 'Documents',
    'Done': 'Done',
    'Earnings': 'Earnings',
    'Edit': 'Edit',
    'Edit workpoint': 'Edit workpoint',
    'Email address': 'Email address',
    'Email is required.': 'Email is required.',
    'Expires {date}': 'Expires {date}',
    'Failed to load invitations.': 'Failed to load invitations.',
    'Failed to open attachment.': 'Failed to open attachment.',
    'Failed to load workpoints.': 'Failed to load workpoints.',
    'Failed to load your documents.': 'Failed to load your documents.',
    'Failed to load your worker dashboard.':
        'Failed to load your worker dashboard.',
    'Failed to save workpoint.': 'Failed to save workpoint.',
    'Failed to send invitation.': 'Failed to send invitation.',
    'File': 'File',
    'Home': 'Home',
    'Hourly wage': 'Hourly wage',
    'Hours': 'Hours',
    'Image': 'Image',
    'Invalid QR code.': 'Invalid QR code.',
    'Invalid date': 'Invalid date',
    'Initial workers': 'Initial workers',
    'Invite a new user': 'Invite a new user',
    'Invite new users by email. Each invitation carries a role and one-time registration link.':
        'Invite new users by email. Each invitation carries a role and one-time registration link.',
    'Invitation link copied.': 'Invitation link copied.',
    'Join the Construction ERP system': 'Join the Construction ERP system',
    'LEADER': 'Leader',
    'Loading dashboard...': 'Loading dashboard...',
    'Loading documents...': 'Loading documents...',
    'Loading invitations...': 'Loading invitations...',
    'Loading preview...': 'Loading preview...',
    'Loading workpoints...': 'Loading workpoints...',
    'Location access is blocked. Enable it in device settings to scan attendance.':
        'Location access is blocked. Enable it in device settings to scan attendance.',
    'Location timed out. Move somewhere with a clearer signal and try again.':
        'Location timed out. Move somewhere with a clearer signal and try again.',
    'Are you sure you want to log out?': 'Are you sure you want to log out?',
    'Light theme': 'Light theme',
    'Login failed': 'Login failed',
    'Log out': 'Log out',
    'Messages': 'Messages',
    'Missing checkout': 'Missing checkout',
    'Must start with an uppercase letter and be at least 6 characters.':
        'Must start with an uppercase letter and be at least 6 characters.',
    'Name': 'Name',
    'Name and address are required.': 'Name and address are required.',
    'Name is required.': 'Name is required.',
    'Network error. Please check the API connection.':
        'Network error. Please check the API connection.',
    'No attendance recorded here for {periodLabel}.':
        'No attendance recorded here for {periodLabel}.',
    'No attendance records': 'No attendance records',
    'No attendance records for {periodLabel}.':
        'No attendance records for {periodLabel}.',
    'New workpoint': 'New workpoint',
    'No account? Register': 'No account? Register',
    'No documents': 'No documents',
    'No documents have been shared with you yet.':
        'No documents have been shared with you yet.',
    'No invitations': 'No invitations',
    'No invitations yet.': 'No invitations yet.',
    'No workers available.': 'No workers available.',
    'No workpoints assigned': 'No workpoints assigned',
    'No workpoints yet': 'No workpoints yet',
    'Not set': 'Not set',
    'Open': 'Open',
    'Open attachment': 'Open attachment',
    'Open records': 'Open records',
    'Open theme': 'Open theme',
    'PDF': 'PDF',
    'PENDING': 'Pending',
    'Pending': 'Pending',
    'Password': 'Password',
    'Password does not match the rules.':
        'Password does not match the rules.',
    'Password is required.': 'Password is required.',
    'Please enter a username.': 'Please enter a username.',
    'Preview and download documents shared with your worker profile.':
        'Preview and download documents shared with your worker profile.',
    'Preview is not available for this file.':
        'Preview is not available for this file.',
    'Refresh': 'Refresh',
    'Register': 'Register',
    'Registration failed': 'Registration failed',
    'Recording attendance...': 'Recording attendance...',
    'Revoke': 'Revoke',
    'Role': 'Role',
    'Previous': 'Previous',
    'REVOKED': 'Revoked',
    'Scan result': 'Scan result',
    'Scan a BuildPulse attendance QR code.':
        'Scan a BuildPulse attendance QR code.',
    'Place the attendance QR code inside the frame.':
        'Place the attendance QR code inside the frame.',
    'EXPIRED': 'Expired',
    'Save': 'Save',
    'Saving...': 'Saving...',
    'Scan attendance': 'Scan attendance',
    'Scan QR': 'Scan QR',
    'Send invitation': 'Send invitation',
    'Sending...': 'Sending...',
    'Sent {date}': 'Sent {date}',
    'Sign in': 'Sign in',
    'Signing in...': 'Signing in...',
    'Something went wrong.': 'Something went wrong.',
    'Tap Open to preview this PDF.': 'Tap Open to preview this PDF.',
    'This attendance was automatically closed at 22:00 and may need review.':
        'This attendance was automatically closed at 22:00 and may need review.',
    'Already completed today': 'Already completed today',
    'Turn on location services to scan attendance.':
        'Turn on location services to scan attendance.',
    'Try again': 'Try again',
    'Unable to record attendance.': 'Unable to record attendance.',
    'Unavailable': 'Unavailable',
    'Uploaded {date}': 'Uploaded {date}',
    'Use the form above to invite your first user.':
        'Use the form above to invite your first user.',
    'User Invitations': 'User Invitations',
    'Username': 'Username',
    'Username must be at least 3 characters.':
        'Username must be at least 3 characters.',
    'View and manage workpoints': 'View and manage workpoints',
    'Welcome back to BuildPulse': 'Welcome back to BuildPulse',
    'WORKER': 'Worker',
    'Workers': 'Workers',
    'Workpoint': 'Workpoint',
    'Workpoints': 'Workpoints',
    'Worker profile': 'Worker profile',
    '{count} complete': '{count} complete',
    '{count} complete days': '{count} complete days',
    '{hours} · {count} records': '{hours} · {count} records',
    'Assigned workpoints': 'Assigned workpoints',
    'Attendance by workpoint': 'Attendance by workpoint',
    'Your own check-ins and check-outs for {periodLabel}.':
        'Your own check-ins and check-outs for {periodLabel}.',
    'Your assignments will show up here.':
        'Your assignments will show up here.',
    'Your BuildPulse home': 'Your BuildPulse home',
    'Your documents': 'Your documents',
    'You are accepting an invitation. Your role will be assigned.':
        'You are accepting an invitation. Your role will be assigned.',
    'Browse job sites and manage workers, attendance, and QR tools.':
        'Browse job sites and manage workers, attendance, and QR tools.',
    'Create one to start assigning workers.':
        'Create one to start assigning workers.',
  },
  AppLanguage.romanian: {
    'Address': 'Adresa',
    'Address is required.': 'Adresa este obligatorie.',
    'Already have an account? Sign in':
        'Ai deja un cont? Autentifica-te',
    'Allow location access to scan attendance.':
        'Permite accesul la locatie pentru a inregistra prezenta.',
    'Ask an admin to set your wage':
        'Cere unui administrator sa iti seteze salariul',
    'Attendance': 'Prezenta',
    'Attendance scan': 'Scanare prezenta',
    'Attendance, hours, assigned workpoints, and wage-based earnings.':
        'Prezenta, orele, punctele de lucru alocate si castigurile bazate pe salariu.',
    'ACCEPTED': 'Acceptata',
    'Checked in': 'Intrare inregistrata',
    'Checked in at': 'Ora intrarii',
    'Checked out': 'Iesire inregistrata',
    'Check-ins and check-outs': 'Intrari si iesiri',
    'Change language': 'Schimba limba',
    'Choose deadline': 'Alege termenul limita',
    'Cancel': 'Anuleaza',
    'Completed attendances': 'Prezente finalizate',
    'Confirm': 'Confirma',
    'Coordinates are generated automatically from the address.':
        'Coordonatele sunt generate automat din adresa.',
    'Copy link': 'Copiaza linkul',
    'Create account': 'Creeaza cont',
    'Creating account...': 'Se creeaza contul...',
    'Create workpoint': 'Creeaza punct de lucru',
    'Create your account': 'Creeaza-ti contul',
    'Created {date}': 'Creat la {date}',
    'Current workpoints assigned to you.':
        'Punctele de lucru care iti sunt alocate acum.',
    'Dark theme': 'Tema inchisa',
    'Date': 'Data',
    'Days': 'Zile',
    'Deadline': 'Termen limita',
    'Deadline {date}': 'Termen limita {date}',
    'Delete': 'Sterge',
    'Delete workpoint': 'Sterge punctul de lucru',
    'Delete {name}? Attendance, assignments, and the workpoint chat will be removed.':
        'Stergi {name}? Prezenta, alocarile si chatul punctului de lucru vor fi eliminate.',
    'Description': 'Descriere',
    'Documents': 'Documente',
    'Done': 'Gata',
    'Earnings': 'Castiguri',
    'Edit': 'Editeaza',
    'Edit workpoint': 'Editeaza punctul de lucru',
    'Email address': 'Adresa de email',
    'Email is required.': 'Emailul este obligatoriu.',
    'Expires {date}': 'Expira la {date}',
    'Failed to load invitations.':
        'Invitatiile nu au putut fi incarcate.',
    'Failed to open attachment.':
        'Atasamentul nu a putut fi deschis.',
    'Failed to load workpoints.':
        'Punctele de lucru nu au putut fi incarcate.',
    'Failed to load your documents.':
        'Documentele tale nu au putut fi incarcate.',
    'Failed to load your worker dashboard.':
        'Tabloul tau de bord nu a putut fi incarcat.',
    'Failed to save workpoint.':
        'Punctul de lucru nu a putut fi salvat.',
    'Failed to send invitation.':
        'Invitatia nu a putut fi trimisa.',
    'File': 'Fisier',
    'Home': 'Acasa',
    'Hourly wage': 'Salariu pe ora',
    'Hours': 'Ore',
    'Image': 'Imagine',
    'Invalid QR code.': 'Cod QR invalid.',
    'Invalid date': 'Data invalida',
    'Initial workers': 'Muncitori initiali',
    'Invite a new user': 'Invita un utilizator nou',
    'Invite new users by email. Each invitation carries a role and one-time registration link.':
        'Invita utilizatori noi prin email. Fiecare invitatie include un rol si un link unic de inregistrare.',
    'Invitation link copied.': 'Linkul invitatiei a fost copiat.',
    'Join the Construction ERP system':
        'Alatura-te sistemului ERP pentru constructii',
    'LEADER': 'Sef echipa',
    'Loading dashboard...': 'Se incarca tabloul de bord...',
    'Loading documents...': 'Se incarca documentele...',
    'Loading invitations...': 'Se incarca invitatiile...',
    'Loading preview...': 'Se incarca previzualizarea...',
    'Loading workpoints...': 'Se incarca punctele de lucru...',
    'Location access is blocked. Enable it in device settings to scan attendance.':
        'Accesul la locatie este blocat. Activeaza-l din setarile dispozitivului pentru a inregistra prezenta.',
    'Location timed out. Move somewhere with a clearer signal and try again.':
        'Locatia a expirat. Mergi intr-un loc cu semnal mai bun si incearca din nou.',
    'Are you sure you want to log out?':
        'Esti sigur ca vrei sa te deconectezi?',
    'Light theme': 'Tema deschisa',
    'Login failed': 'Autentificarea a esuat',
    'Log out': 'Deconectare',
    'Messages': 'Mesaje',
    'Missing checkout': 'Iesire lipsa',
    'Must start with an uppercase letter and be at least 6 characters.':
        'Trebuie sa inceapa cu o litera mare si sa aiba cel putin 6 caractere.',
    'Name': 'Nume',
    'Name and address are required.':
        'Numele si adresa sunt obligatorii.',
    'Name is required.': 'Numele este obligatoriu.',
    'Network error. Please check the API connection.':
        'Eroare de retea. Verifica conexiunea la API.',
    'No attendance recorded here for {periodLabel}.':
        'Nu exista prezenta inregistrata aici pentru {periodLabel}.',
    'No attendance records': 'Fara inregistrari de prezenta',
    'No attendance records for {periodLabel}.':
        'Nu exista inregistrari de prezenta pentru {periodLabel}.',
    'New workpoint': 'Punct de lucru nou',
    'No account? Register': 'Nu ai cont? Inregistreaza-te',
    'No documents': 'Fara documente',
    'No documents have been shared with you yet.':
        'Nu au fost distribuite documente pentru tine inca.',
    'No invitations': 'Fara invitatii',
    'No invitations yet.': 'Nu exista invitatii inca.',
    'No workers available.': 'Nu exista muncitori disponibili.',
    'No workpoints assigned': 'Nu ai puncte de lucru alocate',
    'No workpoints yet': 'Nu exista puncte de lucru inca',
    'Not set': 'Nesetat',
    'Open': 'Deschis',
    'Open attachment': 'Deschide atasamentul',
    'Open records': 'Inregistrari deschise',
    'PDF': 'PDF',
    'PENDING': 'In asteptare',
    'Pending': 'In asteptare',
    'Password': 'Parola',
    'Password does not match the rules.':
        'Parola nu respecta regulile.',
    'Password is required.': 'Parola este obligatorie.',
    'Please enter a username.': 'Introdu un nume de utilizator.',
    'Preview and download documents shared with your worker profile.':
        'Previzualizeaza si descarca documentele distribuite profilului tau de muncitor.',
    'Preview is not available for this file.':
        'Previzualizarea nu este disponibila pentru acest fisier.',
    'Refresh': 'Reincarca',
    'Register': 'Inregistrare',
    'Registration failed': 'Inregistrarea a esuat',
    'Recording attendance...': 'Se inregistreaza prezenta...',
    'Revoke': 'Revoca',
    'Role': 'Rol',
    'Previous': 'Anterior',
    'REVOKED': 'Revocata',
    'Scan result': 'Rezultatul scanarii',
    'Scan a BuildPulse attendance QR code.':
        'Scaneaza un cod QR de prezenta BuildPulse.',
    'Place the attendance QR code inside the frame.':
        'Asaza codul QR de prezenta in interiorul cadrului.',
    'EXPIRED': 'Expirata',
    'Save': 'Salveaza',
    'Saving...': 'Se salveaza...',
    'Scan attendance': 'Scaneaza prezenta',
    'Scan QR': 'Scaneaza QR',
    'Send invitation': 'Trimite invitatia',
    'Sending...': 'Se trimite...',
    'Sent {date}': 'Trimis la {date}',
    'Sign in': 'Autentificare',
    'Signing in...': 'Se autentifica...',
    'Something went wrong.': 'Ceva nu a mers bine.',
    'Tap Open to preview this PDF.':
        'Apasa Deschide pentru a previzualiza acest PDF.',
    'This attendance was automatically closed at 22:00 and may need review.':
        'Aceasta prezenta a fost inchisa automat la 22:00 si poate necesita verificare.',
    'Already completed today': 'Deja finalizata astazi',
    'Turn on location services to scan attendance.':
        'Porneste serviciile de localizare pentru a inregistra prezenta.',
    'Try again': 'Incearca din nou',
    'Unable to record attendance.': 'Prezenta nu a putut fi inregistrata.',
    'Unavailable': 'Indisponibil',
    'Uploaded {date}': 'Incarcat la {date}',
    'Use the form above to invite your first user.':
        'Foloseste formularul de mai sus pentru a invita primul utilizator.',
    'User Invitations': 'Invitatii utilizatori',
    'Username': 'Nume utilizator',
    'Username must be at least 3 characters.':
        'Numele de utilizator trebuie sa aiba cel putin 3 caractere.',
    'View and manage workpoints': 'Vezi si gestioneaza punctele de lucru',
    'Welcome back to BuildPulse': 'Bine ai revenit la BuildPulse',
    'WORKER': 'Muncitor',
    'Workers': 'Muncitori',
    'Workpoint': 'Punct de lucru',
    'Workpoints': 'Puncte de lucru',
    'Worker profile': 'Profil muncitor',
    '{count} complete': '{count} complete',
    '{count} complete days': '{count} zile complete',
    '{hours} · {count} records': '{hours} · {count} inregistrari',
    'Assigned workpoints': 'Puncte de lucru alocate',
    'Attendance by workpoint': 'Prezenta pe punct de lucru',
    'Your own check-ins and check-outs for {periodLabel}.':
        'Intrarile si iesirile tale pentru {periodLabel}.',
    'Your assignments will show up here.':
        'Atribuirile tale vor aparea aici.',
    'Your BuildPulse home': 'Panoul tau BuildPulse',
    'Your documents': 'Documentele tale',
    'You are accepting an invitation. Your role will be assigned.':
        'Accepti o invitatie. Rolul tau va fi atribuit automat.',
    'Browse job sites and manage workers, attendance, and QR tools.':
        'Rasfoieste santierele si gestioneaza muncitorii, prezenta si instrumentele QR.',
    'Create one to start assigning workers.':
        'Creeaza unul pentru a incepe alocarea muncitorilor.',
  },
  AppLanguage.hungarian: {
    'Address': 'Cim',
    'Address is required.': 'A cim megadasa kotelezo.',
    'Already have an account? Sign in': 'Mar van fiokod? Lepj be',
    'Allow location access to scan attendance.':
        'Engedelyezd a helyhozzaferest a jelenlet rogzitesehez.',
    'Ask an admin to set your wage':
        'Kerj meg egy adminisztratort, hogy allitsa be a beredet',
    'Attendance': 'Jelenlet',
    'Attendance scan': 'Jelenlet szkennelese',
    'Attendance, hours, assigned workpoints, and wage-based earnings.':
        'Jelenlet, orak, kijelolt munkapontok es beralapu keresetek.',
    'ACCEPTED': 'Elfogadva',
    'Checked in': 'Belepes rogzitve',
    'Checked in at': 'Belepes ideje',
    'Checked out': 'Kilepes rogzitve',
    'Check-ins and check-outs': 'Belepesek es kilepesek',
    'Change language': 'Nyelvvaltás',
    'Choose deadline': 'Hatarido valasztasa',
    'Cancel': 'Megse',
    'Completed attendances': 'Lezart jelenletek',
    'Confirm': 'Megerősit',
    'Coordinates are generated automatically from the address.':
        'A koordinatak automatikusan keszulnek a cimből.',
    'Copy link': 'Hivatkozas masolasa',
    'Create account': 'Fiok letrehozasa',
    'Creating account...': 'Fiok letrehozasa folyamatban...',
    'Create workpoint': 'Munkapont letrehozasa',
    'Create your account': 'Hozd letre a fiokodat',
    'Created {date}': 'Letrehozva: {date}',
    'Current workpoints assigned to you.':
        'A jelenleg hozzad rendelt munkapontok.',
    'Dark theme': 'Sotet tema',
    'Date': 'Datum',
    'Days': 'Napok',
    'Deadline': 'Hatarido',
    'Deadline {date}': 'Hatarido: {date}',
    'Delete': 'Torles',
    'Delete workpoint': 'Munkapont torlese',
    'Delete {name}? Attendance, assignments, and the workpoint chat will be removed.':
        'Toroljuk ezt: {name}? A jelenlet, a hozzarendelesek es a munkapont csevegese is torlodik.',
    'Description': 'Leiras',
    'Documents': 'Dokumentumok',
    'Done': 'Kesz',
    'Earnings': 'Kereset',
    'Edit': 'Szerkesztes',
    'Edit workpoint': 'Munkapont szerkesztese',
    'Email address': 'Email cim',
    'Email is required.': 'Az email cim kotelezo.',
    'Expires {date}': 'Lejar ekkor: {date}',
    'Failed to load invitations.':
        'A meghivok betoltese nem sikerult.',
    'Failed to open attachment.':
        'A csatolmany megnyitasa nem sikerult.',
    'Failed to load workpoints.':
        'A munkapontok betoltese nem sikerult.',
    'Failed to load your documents.':
        'A dokumentumok betoltese nem sikerult.',
    'Failed to load your worker dashboard.':
        'A dolgozoi attekintes betoltese nem sikerult.',
    'Failed to save workpoint.':
        'A munkapont mentese nem sikerult.',
    'Failed to send invitation.':
        'A meghivo kuldese nem sikerult.',
    'File': 'Fajl',
    'Home': 'Kezdolap',
    'Hourly wage': 'Oraber',
    'Hours': 'Orak',
    'Image': 'Kep',
    'Invalid QR code.': 'Ervenytelen QR-kod.',
    'Invalid date': 'Ervenytelen datum',
    'Initial workers': 'Kezdeti dolgozok',
    'Invite a new user': 'Uj felhasznalo meghivasa',
    'Invite new users by email. Each invitation carries a role and one-time registration link.':
        'Hivj meg uj felhasznalokat emailben. Minden meghivohoz szerepkor es egyszer hasznalhato regisztracios link tartozik.',
    'Invitation link copied.': 'A meghivo linkje masolva.',
    'Join the Construction ERP system':
        'Csatlakozz az epitoipari ERP rendszerhez',
    'LEADER': 'Csapatvezeto',
    'Loading dashboard...': 'Attekintes betoltese...',
    'Loading documents...': 'Dokumentumok betoltese...',
    'Loading invitations...': 'Meghivok betoltese...',
    'Loading preview...': 'Elozet betoltese...',
    'Loading workpoints...': 'Munkapontok betoltese...',
    'Location access is blocked. Enable it in device settings to scan attendance.':
        'A helyhozzaferes le van tiltva. Engedelyezd a keszulek beallitasainal a jelenlet rogzitesehez.',
    'Location timed out. Move somewhere with a clearer signal and try again.':
        'A helymeghatarozas idotullepessel leallt. Menj jobb jelu helyre, es probald ujra.',
    'Are you sure you want to log out?':
        'Biztosan ki szeretnel jelentkezni?',
    'Light theme': 'Vilagos tema',
    'Login failed': 'A belepes sikertelen',
    'Log out': 'Kijelentkezes',
    'Messages': 'Uzenetek',
    'Missing checkout': 'Hianyzo kilepes',
    'Must start with an uppercase letter and be at least 6 characters.':
        'Nagybetuvel kell kezdodnie, es legalabb 6 karakterbol kell allnia.',
    'Name': 'Nev',
    'Name and address are required.':
        'A nev es a cim kotelezo.',
    'Name is required.': 'A nev kotelezo.',
    'Network error. Please check the API connection.':
        'Halozati hiba. Ellenorizd az API kapcsolatot.',
    'No attendance recorded here for {periodLabel}.':
        'Itt nincs rogzitett jelenlet erre: {periodLabel}.',
    'No attendance records': 'Nincsenek jelenleti adatok',
    'No attendance records for {periodLabel}.':
        'Nincsenek jelenleti adatok erre: {periodLabel}.',
    'New workpoint': 'Uj munkapont',
    'No account? Register': 'Nincs fiokod? Regisztralj',
    'No documents': 'Nincsenek dokumentumok',
    'No documents have been shared with you yet.':
        'Meg nem osztottak meg veled dokumentumokat.',
    'No invitations': 'Nincsenek meghivok',
    'No invitations yet.': 'Meg nincsenek meghivok.',
    'No workers available.': 'Nincs elerheto dolgozo.',
    'No workpoints assigned': 'Nincs hozzad rendelt munkapont',
    'No workpoints yet': 'Meg nincsenek munkapontok',
    'Not set': 'Nincs beallitva',
    'Open': 'Nyitott',
    'Open attachment': 'Csatolmany megnyitasa',
    'Open records': 'Nyitott bejegyzesek',
    'PDF': 'PDF',
    'PENDING': 'Fuggoben',
    'Pending': 'Fuggoben',
    'Password': 'Jelszo',
    'Password does not match the rules.':
        'A jelszo nem felel meg a szabalyoknak.',
    'Password is required.': 'A jelszo kotelezo.',
    'Please enter a username.': 'Adj meg egy felhasznalonevet.',
    'Preview and download documents shared with your worker profile.':
        'Tekintsd meg es toltsd le a dolgozoi profilodhoz megosztott dokumentumokat.',
    'Preview is not available for this file.':
        'Ehhez a fajlhoz nem erheto el elonezet.',
    'Refresh': 'Frissites',
    'Register': 'Regisztracio',
    'Registration failed': 'A regisztracio sikertelen',
    'Recording attendance...': 'Jelenlet rogzitese folyamatban...',
    'Revoke': 'Visszavonas',
    'Role': 'Szerepkor',
    'Previous': 'Korabbi',
    'REVOKED': 'Visszavonva',
    'Scan result': 'Szkenneles eredmenye',
    'Scan a BuildPulse attendance QR code.':
        'Szkennelj be egy BuildPulse jelenleti QR-kodot.',
    'Place the attendance QR code inside the frame.':
        'Helyezd a jelenleti QR-kodot a keretbe.',
    'EXPIRED': 'Lejart',
    'Save': 'Mentes',
    'Saving...': 'Mentes folyamatban...',
    'Scan attendance': 'Jelenlet szkennelese',
    'Scan QR': 'QR szkennelese',
    'Send invitation': 'Meghivo kuldese',
    'Sending...': 'Kuldes...',
    'Sent {date}': 'Elkuldes: {date}',
    'Sign in': 'Belepes',
    'Signing in...': 'Belepes folyamatban...',
    'Something went wrong.': 'Valami hiba tortent.',
    'Tap Open to preview this PDF.':
        'Erintsd meg a Megnyitas gombot a PDF elonezetehez.',
    'This attendance was automatically closed at 22:00 and may need review.':
        'Ez a jelenlet automatikusan lezarult 22:00-kor, es ellenorzesre szorulhat.',
    'Already completed today': 'Ma mar lezarva',
    'Turn on location services to scan attendance.':
        'Kapcsold be a helymeghatarozast a jelenlet rogzitesehez.',
    'Try again': 'Probald ujra',
    'Unable to record attendance.': 'A jelenlet rogzitese nem sikerult.',
    'Unavailable': 'Nem erheto el',
    'Uploaded {date}': 'Feltoltve: {date}',
    'Use the form above to invite your first user.':
        'A fenti urlappal hívhatod meg az elso felhasznalot.',
    'User Invitations': 'Felhasznaloi meghivok',
    'Username': 'Felhasznalonev',
    'Username must be at least 3 characters.':
        'A felhasznalonevnek legalabb 3 karakteresnek kell lennie.',
    'View and manage workpoints': 'Munkapontok megtekintese es kezelese',
    'Welcome back to BuildPulse': 'Udvozol ujra a BuildPulse-ban',
    'WORKER': 'Munkas',
    'Workers': 'Dolgozok',
    'Workpoint': 'Munkapont',
    'Workpoints': 'Munkapontok',
    'Worker profile': 'Dolgozoi profil',
    '{count} complete': '{count} lezart',
    '{count} complete days': '{count} teljes nap',
    '{hours} · {count} records': '{hours} · {count} bejegyzes',
    'Assigned workpoints': 'Kijelolt munkapontok',
    'Attendance by workpoint': 'Jelenlet munkapontonkent',
    'Your own check-ins and check-outs for {periodLabel}.':
        'A sajat belepeseid es kilepeseid {periodLabel} idoszakban.',
    'Your assignments will show up here.':
        'A hozzarendelesek itt fognak megjelenni.',
    'Your BuildPulse home': 'A te BuildPulse kezdolapod',
    'Your documents': 'Sajat dokumentumok',
    'You are accepting an invitation. Your role will be assigned.':
        'Egy meghivot fogadsz el. A szerepkorod automatikusan be lesz allitva.',
    'Browse job sites and manage workers, attendance, and QR tools.':
        'Bongessz a munkateruletek kozott, es kezeld a dolgozokat, a jelenletet es a QR eszkozoket.',
    'Create one to start assigning workers.':
        'Hozz letre egyet a dolgozok hozzarendelesehez.',
  },
};

AppLanguage _activeLanguage = AppLanguage.english;

String translate(String key, [Map<String, String>? params]) {
  return _translate(_activeLanguage, key, params);
}

String _translate(
  AppLanguage language,
  String key, [
  Map<String, String>? params,
]) {
  final template =
      _messages[language]?[key] ??
      _messages[AppLanguage.english]?[key] ??
      key;
  if (params == null || params.isEmpty) return template;

  var result = template;
  for (final entry in params.entries) {
    result = result.replaceAll('{${entry.key}}', entry.value);
  }
  return result;
}
