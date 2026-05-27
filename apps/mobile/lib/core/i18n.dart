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

const supportedAppLocales = <Locale>[Locale('en'), Locale('ro'), Locale('hu')];

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
    'Delete document': 'Delete document',
    'Delete workpoint': 'Delete workpoint',
    'Delete {name}?': 'Delete {name}?',
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
    'Please enter a valid email address.':
        'Please enter a valid email address.',
    'Email must be at most 254 characters.':
        'Email must be at most 254 characters.',
    'Expires {date}': 'Expires {date}',
    'Failed to load invitations.': 'Failed to load invitations.',
    'Failed to open attachment.': 'Failed to open attachment.',
    'Failed to load workpoints.': 'Failed to load workpoints.',
    'Failed to load workpoint documents.':
        'Failed to load workpoint documents.',
    'Failed to load your documents.': 'Failed to load your documents.',
    'Failed to load your worker dashboard.':
        'Failed to load your worker dashboard.',
    'Failed to save workpoint.': 'Failed to save workpoint.',
    'Failed to send invitation.': 'Failed to send invitation.',
    'Failed to upload document.': 'Failed to upload document.',
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
    'No documents uploaded for this workpoint.':
        'No documents uploaded for this workpoint.',
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
    'Password does not match the rules.': 'Password does not match the rules.',
    'Password is required.': 'Password is required.',
    'Password must start with an uppercase letter.':
        'Password must start with an uppercase letter.',
    'Password must be at least 6 characters.':
        'Password must be at least 6 characters.',
    'Password must be at most 100 characters.':
        'Password must be at most 100 characters.',
    'Please enter a username.': 'Please enter a username.',
    'Preview and download documents shared with your worker profile.':
        'Preview and download documents shared with your worker profile.',
    'Preview is not available for this file.':
        'Preview is not available for this file.',
    'Refresh': 'Refresh',
    'Register': 'Register',
    'Registration failed': 'Registration failed',
    'Username already taken': 'Username already taken',
    'Username must be at most 50 characters.':
        'Username must be at most 50 characters.',
    'An invitation token is required to register':
        'An invitation token is required to register',
    'Invitation is invalid, expired, or does not match this email':
        'Invitation is invalid, expired, or does not match this email',
    'Invitation token cannot be empty.': 'Invitation token cannot be empty.',
    'Invitation token is too long.': 'Invitation token is too long.',
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
    'Upload': 'Upload',
    'Uploading...': 'Uploading...',
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
    'Workpoint documents': 'Workpoint documents',
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
    'by {name}': 'by {name}',
    'Create one to start assigning workers.':
        'Create one to start assigning workers.',
    'Active': 'Active',
    'Actions': 'Actions',
    'Add': 'Add',
    'Assign a worker before adding attendance.':
        'Assign a worker before adding attendance.',
    'Assign worker': 'Assign worker',
    'Assigned workers': 'Assigned workers',
    'Attach file': 'Attach file',
    'Attachment': 'Attachment',
    'Attachment link is invalid.': 'Attachment link is invalid.',
    'Attachment: {name}': 'Attachment: {name}',
    'Back': 'Back',
    'BuildPulse': 'BuildPulse',
    'Cancel reply': 'Cancel reply',
    'Check in': 'Check in',
    'Check out': 'Check out',
    'Close': 'Close',
    'Completed': 'Completed',
    'Connected': 'Connected',
    'Conversations': 'Conversations',
    'Delete attendance': 'Delete attendance',
    'Delete attendance for {name}?': 'Delete attendance for {name}?',
    'Delete {name}? This action cannot be undone.':
        'Delete {name}? This action cannot be undone.',
    'Delete worker': 'Delete worker',
    'Documents for {name}': 'Documents for {name}',
    'Email': 'Email',
    'Existing printed codes will stop working.':
        'Existing printed codes will stop working.',
    'Export': 'Export',
    'Exporting...': 'Exporting...',
    'Failed to add attendance.': 'Failed to add attendance.',
    'Failed to create chat.': 'Failed to create chat.',
    'Failed to export attendance.': 'Failed to export attendance.',
    'Failed to load attendance.': 'Failed to load attendance.',
    'Failed to load documents.': 'Failed to load documents.',
    'Failed to load this workpoint.': 'Failed to load this workpoint.',
    'Failed to load workers.': 'Failed to load workers.',
    'Failed to set checkout.': 'Failed to set checkout.',
    'Failed to update worker.': 'Failed to update worker.',
    'Failed to upload attachment.': 'Failed to upload attachment.',
    'Filter records and export the same period to Excel.':
        'Filter records and export the same period to Excel.',
    'From': 'From',
    'Hourly wage (RON)': 'Hourly wage (RON)',
    'Hours: {value}': 'Hours: {value}',
    'Loading attendance...': 'Loading attendance...',
    'Loading conversations...': 'Loading conversations...',
    'Loading messages...': 'Loading messages...',
    'Loading workpoint...': 'Loading workpoint...',
    'Loading workers...': 'Loading workers...',
    'Manual attendance': 'Manual attendance',
    'Manual entry': 'Manual entry',
    'Manage registered workers and their documents.':
        'Manage registered workers and their documents.',
    'New conversation': 'New conversation',
    'No conversations': 'No conversations',
    'No messages yet': 'No messages yet',
    'No users found': 'No users found',
    'No wage': 'No wage',
    'No workers assigned to this workpoint.':
        'No workers assigned to this workpoint.',
    'No workers available to assign.': 'No workers available to assign.',
    'No workers registered yet': 'No workers registered yet',
    'Not checked out yet': 'Not checked out yet',
    'Offline': 'Offline',
    'Open QR': 'Open QR',
    'QR check-in': 'QR check-in',
    'QR code is not available yet.': 'QR code is not available yet.',
    'QR link copied.': 'QR link copied.',
    'Records {count}': 'Records {count}',
    'Remove': 'Remove',
    'Remove {name} from this workpoint?': 'Remove {name} from this workpoint?',
    'Remove worker': 'Remove worker',
    'Replying to {name}: {message}': 'Replying to {name}: {message}',
    'Rotate': 'Rotate',
    'Rotate QR code': 'Rotate QR code',
    'Search conversations': 'Search conversations',
    'Search users': 'Search users',
    'Send': 'Send',
    'Set checkout': 'Set checkout',
    'Start a direct chat or wait for a workpoint chat.':
        'Start a direct chat or wait for a workpoint chat.',
    'Time': 'Time',
    'To': 'To',
    'Typing...': 'Typing...',
    'Worker': 'Worker',
    'Workers {count}': 'Workers {count}',
    'Workers scan this code to check in or out.':
        'Workers scan this code to check in or out.',
    'Worker not found': 'Worker not found',
    'Workpoint details': 'Workpoint details',
    'Work point not found': 'Work point not found',
    'Workpoint not found': 'Workpoint not found',
    'Attendance record not found': 'Attendance record not found',
    'Document not found': 'Document not found',
    'Document file not found': 'Document file not found',
    'One or more workers were not found': 'One or more workers were not found',
    'Only users with the WORKER role can be assigned':
        'Only users with the WORKER role can be assigned',
    'workerId is required': 'workerId is required',
    'This workpoint does not have coordinates set':
        'This workpoint does not have coordinates set',
    'You are not assigned to this workpoint':
        'You are not assigned to this workpoint',
    'You must be within 100m of this workpoint to scan attendance':
        'You must be within 100m of this workpoint to scan attendance',
    'A user with this email already exists':
        'A user with this email already exists',
    'Invitation not found': 'Invitation not found',
    'Invitation already accepted': 'Invitation already accepted',
    'Cannot chat with yourself': 'Cannot chat with yourself',
    'Must be a valid UUID': 'Must be a valid UUID',
    'Must be a valid ISO datetime': 'Must be a valid ISO datetime',
    'At least one field is required': 'At least one field is required',
    'Invalid request payload.': 'Invalid request payload.',
    'Workpoints {count}': 'Workpoints {count}',
    'Write a message...': 'Write a message...',
    '{amount} RON/h': '{amount} RON/h',
    'Leave Calendar': 'Leave Calendar',
    'Select a leave period directly on the calendar.':
        'Select a leave period directly on the calendar.',
    'Review employee leave requests and approved absences.':
        'Review employee leave requests and approved absences.',
    'Loading leave requests...': 'Loading leave requests...',
    'Failed to load leave requests.': 'Failed to load leave requests.',
    'You cannot select past dates.': 'You cannot select past dates.',
    'End date cannot be before start date':
        'End date cannot be before start date',
    'This period overlaps with an existing request.':
        'This period overlaps with an existing request.',
    'Please select a start and end date.':
        'Please select a start and end date.',
    'Please choose a leave type.': 'Please choose a leave type.',
    'Leave request submitted.': 'Leave request submitted.',
    'User not found': 'User not found',
    'Admins cannot create leave requests':
        'Admins cannot create leave requests',
    'Only admins and leaders can review requests':
        'Only admins and leaders can review requests',
    'Failed to submit leave request.': 'Failed to submit leave request.',
    'Leave request approved.': 'Leave request approved.',
    'Leave request not found': 'Leave request not found',
    'You cannot review your own leave request':
        'You cannot review your own leave request',
    'Only pending requests can be reviewed':
        'Only pending requests can be reviewed',
    'Failed to approve leave request.': 'Failed to approve leave request.',
    'Leave request rejected.': 'Leave request rejected.',
    'Failed to reject leave request.': 'Failed to reject leave request.',
    'Cancel request': 'Cancel request',
    'Cancel this pending request?': 'Cancel this pending request?',
    'Leave request canceled.': 'Leave request canceled.',
    'You can only cancel your own requests':
        'You can only cancel your own requests',
    'Only pending requests can be canceled':
        'Only pending requests can be canceled',
    'Failed to cancel leave request.': 'Failed to cancel leave request.',
    'Click a start date, then an end date.':
        'Click a start date, then an end date.',
    'Approved leave is highlighted on the calendar.':
        'Approved leave is highlighted on the calendar.',
    'Previous month': 'Previous month',
    'Next month': 'Next month',
    'Mon': 'Mon',
    'Tue': 'Tue',
    'Wed': 'Wed',
    'Thu': 'Thu',
    'Fri': 'Fri',
    'Sat': 'Sat',
    'Sun': 'Sun',
    'New leave request': 'New leave request',
    'Select dates and lock the period for approval.':
        'Select dates and lock the period for approval.',
    'Vacation leave': 'Vacation leave',
    'Sick leave': 'Sick leave',
    'Leave type': 'Leave type',
    'Not selected': 'Not selected',
    'Start date': 'Start date',
    'End date': 'End date',
    'Submitting...': 'Submitting...',
    'Submit request': 'Submit request',
    'Clear': 'Clear',
    'Pending approvals': 'Pending approvals',
    'Requests waiting for a manager decision.':
        'Requests waiting for a manager decision.',
    'No pending requests.': 'No pending requests.',
    'All leave requests': 'All leave requests',
    'Your leave requests': 'Your leave requests',
    'Approved and rejected requests stay visible here.':
        'Approved and rejected requests stay visible here.',
    'Track your submitted leave requests and approval status.':
        'Track your submitted leave requests and approval status.',
    'No reviewed leave requests yet.': 'No reviewed leave requests yet.',
    'No leave requests yet.': 'No leave requests yet.',
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'Submitted': 'Submitted',
    'Approve': 'Approve',
    'Reject': 'Reject',
  },
  AppLanguage.romanian: {
    'Address': 'Adresa',
    'Address is required.': 'Adresa este obligatorie.',
    'Already have an account? Sign in': 'Ai deja un cont? Autentifica-te',
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
    'Delete document': 'Sterge documentul',
    'Delete workpoint': 'Sterge punctul de lucru',
    'Delete {name}?': 'Stergi {name}?',
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
    'Please enter a valid email address.':
        'Te rugam sa introduci o adresa de email valida.',
    'Email must be at most 254 characters.':
        'Emailul poate avea cel mult 254 de caractere.',
    'Expires {date}': 'Expira la {date}',
    'Failed to load invitations.': 'Invitatiile nu au putut fi incarcate.',
    'Failed to open attachment.': 'Atasamentul nu a putut fi deschis.',
    'Failed to load workpoints.': 'Punctele de lucru nu au putut fi incarcate.',
    'Failed to load workpoint documents.':
        'Documentele punctului de lucru nu au putut fi incarcate.',
    'Failed to load your documents.':
        'Documentele tale nu au putut fi incarcate.',
    'Failed to load your worker dashboard.':
        'Tabloul tau de bord nu a putut fi incarcat.',
    'Failed to save workpoint.': 'Punctul de lucru nu a putut fi salvat.',
    'Failed to send invitation.': 'Invitatia nu a putut fi trimisa.',
    'Failed to upload document.': 'Documentul nu a putut fi incarcat.',
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
    'Name and address are required.': 'Numele si adresa sunt obligatorii.',
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
    'No documents uploaded for this workpoint.':
        'Nu exista documente incarcate pentru acest punct de lucru.',
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
    'Password does not match the rules.': 'Parola nu respecta regulile.',
    'Password is required.': 'Parola este obligatorie.',
    'Password must start with an uppercase letter.':
        'Parola trebuie sa inceapa cu o litera mare.',
    'Password must be at least 6 characters.':
        'Parola trebuie sa aiba cel putin 6 caractere.',
    'Password must be at most 100 characters.':
        'Parola poate avea cel mult 100 de caractere.',
    'Please enter a username.': 'Introdu un nume de utilizator.',
    'Preview and download documents shared with your worker profile.':
        'Previzualizeaza si descarca documentele distribuite profilului tau de muncitor.',
    'Preview is not available for this file.':
        'Previzualizarea nu este disponibila pentru acest fisier.',
    'Refresh': 'Reincarca',
    'Register': 'Inregistrare',
    'Registration failed': 'Inregistrarea a esuat',
    'Username already taken': 'Numele de utilizator este deja folosit.',
    'Username must be at most 50 characters.':
        'Numele de utilizator poate avea cel mult 50 de caractere.',
    'An invitation token is required to register':
        'Este necesar un token de invitatie pentru inregistrare.',
    'Invitation is invalid, expired, or does not match this email':
        'Invitatia este invalida, expirata sau nu se potriveste cu acest email.',
    'Invitation token cannot be empty.':
        'Tokenul de invitatie nu poate fi gol.',
    'Invitation token is too long.': 'Tokenul de invitatie este prea lung.',
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
    'Upload': 'Incarca',
    'Uploading...': 'Se incarca...',
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
    'Workpoint documents': 'Documente punct de lucru',
    'Workpoints': 'Puncte de lucru',
    'Worker profile': 'Profil muncitor',
    '{count} complete': '{count} complete',
    '{count} complete days': '{count} zile complete',
    '{hours} · {count} records': '{hours} · {count} inregistrari',
    'Assigned workpoints': 'Puncte de lucru alocate',
    'Attendance by workpoint': 'Prezenta pe punct de lucru',
    'Your own check-ins and check-outs for {periodLabel}.':
        'Intrarile si iesirile tale pentru {periodLabel}.',
    'Your assignments will show up here.': 'Atribuirile tale vor aparea aici.',
    'Your BuildPulse home': 'Panoul tau BuildPulse',
    'Your documents': 'Documentele tale',
    'You are accepting an invitation. Your role will be assigned.':
        'Accepti o invitatie. Rolul tau va fi atribuit automat.',
    'Browse job sites and manage workers, attendance, and QR tools.':
        'Rasfoieste santierele si gestioneaza muncitorii, prezenta si instrumentele QR.',
    'by {name}': 'de {name}',
    'Create one to start assigning workers.':
        'Creeaza unul pentru a incepe alocarea muncitorilor.',
    'Active': 'Activ',
    'Actions': 'Actiuni',
    'Add': 'Adauga',
    'Assign a worker before adding attendance.':
        'Aloca un muncitor inainte de a adauga prezenta.',
    'Assign worker': 'Atribuie muncitor',
    'Assigned workers': 'Muncitori alocati',
    'Attach file': 'Ataseaza fisier',
    'Attachment': 'Atasament',
    'Attachment link is invalid.': 'Linkul atasamentului este invalid.',
    'Attachment: {name}': 'Atasament: {name}',
    'Back': 'Inapoi',
    'BuildPulse': 'BuildPulse',
    'Cancel reply': 'Anuleaza raspunsul',
    'Check in': 'Intrare',
    'Check out': 'Iesire',
    'Close': 'Inchide',
    'Completed': 'Finalizat',
    'Connected': 'Conectat',
    'Conversations': 'Conversatii',
    'Delete attendance': 'Sterge prezenta',
    'Delete attendance for {name}?': 'Stergi prezenta pentru {name}?',
    'Delete {name}? This action cannot be undone.':
        'Stergi {name}? Aceasta actiune nu poate fi anulata.',
    'Delete worker': 'Sterge muncitor',
    'Documents for {name}': 'Documente pentru {name}',
    'Email': 'Email',
    'Existing printed codes will stop working.':
        'Codurile tiparite existente nu vor mai functiona.',
    'Export': 'Exporta',
    'Exporting...': 'Se exporta...',
    'Failed to add attendance.': 'Prezenta nu a putut fi adaugata.',
    'Failed to create chat.': 'Chatul nu a putut fi creat.',
    'Failed to export attendance.': 'Prezenta nu a putut fi exportata.',
    'Failed to load attendance.': 'Prezenta nu a putut fi incarcata.',
    'Failed to load documents.': 'Documentele nu au putut fi incarcate.',
    'Failed to load this workpoint.':
        'Acest punct de lucru nu a putut fi incarcat.',
    'Failed to load workers.': 'Muncitorii nu au putut fi incarcati.',
    'Failed to set checkout.': 'Iesirea nu a putut fi setata.',
    'Failed to update worker.': 'Muncitorul nu a putut fi actualizat.',
    'Failed to upload attachment.': 'Atasamentul nu a putut fi incarcat.',
    'Filter records and export the same period to Excel.':
        'Filtreaza inregistrarile si exporta aceeasi perioada in Excel.',
    'From': 'De la',
    'Hourly wage (RON)': 'Salariu pe ora (RON)',
    'Hours: {value}': 'Ore: {value}',
    'Loading attendance...': 'Se incarca prezenta...',
    'Loading conversations...': 'Se incarca conversatiile...',
    'Loading messages...': 'Se incarca mesajele...',
    'Loading workpoint...': 'Se incarca punctul de lucru...',
    'Loading workers...': 'Se incarca muncitorii...',
    'Manual attendance': 'Prezenta manuala',
    'Manual entry': 'Intrare manuala',
    'Manage registered workers and their documents.':
        'Gestioneaza muncitorii inregistrati si documentele lor.',
    'New conversation': 'Conversatie noua',
    'No conversations': 'Nicio conversatie',
    'No messages yet': 'Niciun mesaj inca',
    'No users found': 'Nu s-au gasit utilizatori',
    'No wage': 'Fara salariu',
    'No workers assigned to this workpoint.':
        'Nu sunt muncitori alocati acestui punct de lucru.',
    'No workers available to assign.':
        'Nu exista muncitori disponibili de alocat.',
    'No workers registered yet': 'Nu exista muncitori inregistrati inca',
    'Not checked out yet': 'Iesire neinregistrata inca',
    'Offline': 'Offline',
    'Open QR': 'Deschide QR',
    'QR check-in': 'Check-in QR',
    'QR code is not available yet.': 'Codul QR nu este disponibil inca.',
    'QR link copied.': 'Linkul QR a fost copiat.',
    'Records {count}': 'Inregistrari {count}',
    'Remove': 'Elimina',
    'Remove {name} from this workpoint?':
        'Elimini {name} de la acest punct de lucru?',
    'Remove worker': 'Elimina muncitor',
    'Replying to {name}: {message}': 'Raspunzi lui {name}: {message}',
    'Rotate': 'Roteaza',
    'Rotate QR code': 'Roteaza codul QR',
    'Search conversations': 'Cauta conversatii',
    'Search users': 'Cauta utilizatori',
    'Send': 'Trimite',
    'Set checkout': 'Seteaza iesirea',
    'Start a direct chat or wait for a workpoint chat.':
        'Porneste un chat direct sau asteapta un chat de punct de lucru.',
    'Time': 'Ora',
    'To': 'Pana la',
    'Typing...': 'Tasteaza...',
    'Worker': 'Muncitor',
    'Workers {count}': 'Muncitori {count}',
    'Workers scan this code to check in or out.':
        'Muncitorii scaneaza acest cod pentru a intra sau iesi.',
    'Worker not found': 'Muncitorul nu a fost gasit',
    'Workpoint details': 'Detalii punct de lucru',
    'Work point not found': 'Punctul de lucru nu a fost gasit',
    'Workpoint not found': 'Punct de lucru negasit',
    'Attendance record not found': 'Inregistrarea de prezenta nu a fost gasita',
    'Document not found': 'Documentul nu a fost gasit',
    'Document file not found': 'Fisierul documentului nu a fost gasit',
    'One or more workers were not found':
        'Unul sau mai multi muncitori nu au fost gasiti',
    'Only users with the WORKER role can be assigned':
        'Doar utilizatorii cu rolul WORKER pot fi alocati',
    'workerId is required': 'workerId este obligatoriu',
    'This workpoint does not have coordinates set':
        'Acest punct de lucru nu are coordonate setate',
    'You are not assigned to this workpoint':
        'Nu esti alocat la acest punct de lucru',
    'You must be within 100m of this workpoint to scan attendance':
        'Trebuie sa fii la cel mult 100 m de acest punct de lucru pentru a scana prezenta',
    'A user with this email already exists':
        'Exista deja un utilizator cu acest email',
    'Invitation not found': 'Invitatia nu a fost gasita',
    'Invitation already accepted': 'Invitatia a fost deja acceptata',
    'Cannot chat with yourself': 'Nu poti deschide un chat cu tine insuti',
    'Must be a valid UUID': 'Trebuie sa fie un UUID valid',
    'Must be a valid ISO datetime': 'Trebuie sa fie o data si ora ISO valida',
    'At least one field is required': 'Este necesar cel putin un camp',
    'Invalid request payload.': 'Payload de cerere invalid.',
    'Workpoints {count}': 'Puncte de lucru {count}',
    'Write a message...': 'Scrie un mesaj...',
    '{amount} RON/h': '{amount} RON/ora',
    'Leave Calendar': 'Calendar concedii',
    'Select a leave period directly on the calendar.':
        'Selecteaza o perioada de concediu direct in calendar.',
    'Review employee leave requests and approved absences.':
        'Revizuieste cererile de concediu ale angajatilor si absentele aprobate.',
    'Loading leave requests...': 'Se incarca cererile de concediu...',
    'Failed to load leave requests.':
        'Cererile de concediu nu au putut fi incarcate.',
    'You cannot select past dates.': 'Nu poti selecta date din trecut.',
    'End date cannot be before start date':
        'Data de sfarsit nu poate fi inaintea datei de inceput.',
    'This period overlaps with an existing request.':
        'Aceasta perioada se suprapune cu o cerere existenta.',
    'Please select a start and end date.':
        'Te rugam sa selectezi o data de inceput si una de sfarsit.',
    'Please choose a leave type.': 'Te rugam sa alegi un tip de concediu.',
    'Leave request submitted.': 'Cererea de concediu a fost trimisa.',
    'User not found': 'Utilizatorul nu a fost gasit',
    'Admins cannot create leave requests':
        'Administratorii nu pot crea cereri de concediu',
    'Only admins and leaders can review requests':
        'Doar administratorii si sefii de echipa pot revizui cererile',
    'Failed to submit leave request.':
        'Cererea de concediu nu a putut fi trimisa.',
    'Leave request approved.': 'Cererea de concediu a fost aprobata.',
    'Leave request not found': 'Cererea de concediu nu a fost gasita',
    'You cannot review your own leave request':
        'Nu iti poti revizui propria cerere de concediu',
    'Only pending requests can be reviewed':
        'Doar cererile in asteptare pot fi revizuite',
    'Failed to approve leave request.':
        'Cererea de concediu nu a putut fi aprobata.',
    'Leave request rejected.': 'Cererea de concediu a fost respinsa.',
    'Failed to reject leave request.':
        'Cererea de concediu nu a putut fi respinsa.',
    'Cancel request': 'Anuleaza cererea',
    'Cancel this pending request?': 'Anulezi aceasta cerere in asteptare?',
    'Leave request canceled.': 'Cererea de concediu a fost anulata.',
    'You can only cancel your own requests':
        'Poti anula doar propriile tale cereri',
    'Only pending requests can be canceled':
        'Doar cererile in asteptare pot fi anulate',
    'Failed to cancel leave request.':
        'Cererea de concediu nu a putut fi anulata.',
    'Click a start date, then an end date.':
        'Apasa o data de inceput, apoi o data de sfarsit.',
    'Approved leave is highlighted on the calendar.':
        'Concediile aprobate sunt evidentiate in calendar.',
    'Previous month': 'Luna anterioara',
    'Next month': 'Luna urmatoare',
    'Mon': 'Lun',
    'Tue': 'Mar',
    'Wed': 'Mie',
    'Thu': 'Joi',
    'Fri': 'Vin',
    'Sat': 'Sam',
    'Sun': 'Dum',
    'New leave request': 'Cerere de concediu noua',
    'Select dates and lock the period for approval.':
        'Selecteaza datele si blocheaza perioada pentru aprobare.',
    'Vacation leave': 'Concediu de odihna',
    'Sick leave': 'Concediu medical',
    'Leave type': 'Tip concediu',
    'Not selected': 'Neselectat',
    'Start date': 'Data de inceput',
    'End date': 'Data de sfarsit',
    'Submitting...': 'Se trimite...',
    'Submit request': 'Trimite cererea',
    'Clear': 'Goleste',
    'Pending approvals': 'Aprobari in asteptare',
    'Requests waiting for a manager decision.':
        'Cereri in asteptarea unei decizii de la manager.',
    'No pending requests.': 'Nu exista cereri in asteptare.',
    'All leave requests': 'Toate cererile de concediu',
    'Your leave requests': 'Cererile tale de concediu',
    'Approved and rejected requests stay visible here.':
        'Cereri aprobate si respinse raman vizibile aici.',
    'Track your submitted leave requests and approval status.':
        'Urmareste cererile de concediu trimise si statusul aprobarii.',
    'No reviewed leave requests yet.': 'Nu exista cereri revizuite inca.',
    'No leave requests yet.': 'Nu exista cereri de concediu inca.',
    'Approved': 'Aprobata',
    'Rejected': 'Respinsa',
    'Submitted': 'Trimisa',
    'Approve': 'Aproba',
    'Reject': 'Respinge',
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
    'Delete document': 'Dokumentum torlese',
    'Delete workpoint': 'Munkapont torlese',
    'Delete {name}?': 'Toroljuk {name}?',
    'Delete {name}? Attendance, assignments, and the workpoint chat will be removed.':
        'Toroljuk ezt: {name}? A jelenlet, a hozzarendelesek es a munkapont csevegese is torlodik.',
    'Description': 'Leiras',
    'Documents': 'Dokumentumok',
    'Documents for {name}': 'Dokumentumok: {name}',
    'Done': 'Kesz',
    'Earnings': 'Kereset',
    'Edit': 'Szerkesztes',
    'Edit workpoint': 'Munkapont szerkesztese',
    'Email address': 'Email cim',
    'Email is required.': 'Az email cim kotelezo.',
    'Please enter a valid email address.': 'Adj meg egy ervenyes email cimet.',
    'Email must be at most 254 characters.':
        'Az email cim legfeljebb 254 karakter lehet.',
    'Expires {date}': 'Lejar ekkor: {date}',
    'Failed to load invitations.': 'A meghivok betoltese nem sikerult.',
    'Failed to open attachment.': 'A csatolmany megnyitasa nem sikerult.',
    'Failed to load workpoints.': 'A munkapontok betoltese nem sikerult.',
    'Failed to load workpoint documents.':
        'A munkapont dokumentumainak betoltese nem sikerult.',
    'Failed to load your documents.': 'A dokumentumok betoltese nem sikerult.',
    'Failed to load your worker dashboard.':
        'A dolgozoi attekintes betoltese nem sikerult.',
    'Failed to save workpoint.': 'A munkapont mentese nem sikerult.',
    'Failed to send invitation.': 'A meghivo kuldese nem sikerult.',
    'Failed to upload document.': 'A dokumentum feltoltese nem sikerult.',
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
    'Are you sure you want to log out?': 'Biztosan ki szeretnel jelentkezni?',
    'Light theme': 'Vilagos tema',
    'Login failed': 'A belepes sikertelen',
    'Log out': 'Kijelentkezes',
    'Messages': 'Uzenetek',
    'Missing checkout': 'Hianyzo kilepes',
    'Must start with an uppercase letter and be at least 6 characters.':
        'Nagybetuvel kell kezdodnie, es legalabb 6 karakterbol kell allnia.',
    'Name': 'Nev',
    'Name and address are required.': 'A nev es a cim kotelezo.',
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
    'No documents uploaded for this workpoint.':
        'Ehhez a munkaponthoz meg nincs feltoltott dokumentum.',
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
    'Password must start with an uppercase letter.':
        'A jelszonak nagybetuvel kell kezdodnie.',
    'Password must be at least 6 characters.':
        'A jelszonak legalabb 6 karakteresnek kell lennie.',
    'Password must be at most 100 characters.':
        'A jelszo legfeljebb 100 karakter lehet.',
    'Please enter a username.': 'Adj meg egy felhasznalonevet.',
    'Preview and download documents shared with your worker profile.':
        'Tekintsd meg es toltsd le a dolgozoi profilodhoz megosztott dokumentumokat.',
    'Preview is not available for this file.':
        'Ehhez a fajlhoz nem erheto el elonezet.',
    'Refresh': 'Frissites',
    'Register': 'Regisztracio',
    'Registration failed': 'A regisztracio sikertelen',
    'Username already taken': 'Ez a felhasznalonev mar foglalt.',
    'Username must be at most 50 characters.':
        'A felhasznalonev legfeljebb 50 karakter lehet.',
    'An invitation token is required to register':
        'A regisztraciohoz meghivo token szukseges.',
    'Invitation is invalid, expired, or does not match this email':
        'A meghivo ervenytelen, lejart, vagy nem ehhez az email cimhez tartozik.',
    'Invitation token cannot be empty.': 'A meghivo token nem lehet ures.',
    'Invitation token is too long.': 'A meghivo token tul hosszu.',
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
    'Upload': 'Feltoltes',
    'Uploading...': 'Feltoltes...',
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
    'Workpoint documents': 'Munkapont dokumentumai',
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
    'by {name}': '{name} altal',
    'Create one to start assigning workers.':
        'Hozz letre egyet a dolgozok hozzarendelesehez.',
    'Active': 'Aktiv',
    'Actions': 'Muveletek',
    'Add': 'Hozzaad',
    'Assign a worker before adding attendance.':
        'Rendelj hozza dolgozot, mielott jelenletet adsz hozza.',
    'Assign worker': 'Dolgozo hozzarendelese',
    'Assigned workers': 'Hozzarendelt dolgozok',
    'Attach file': 'Fajl csatolasa',
    'Attachment': 'Csatolmany',
    'Attachment link is invalid.': 'A csatolmany hivatkozasa ervenytelen.',
    'Attachment: {name}': 'Csatolmany: {name}',
    'Back': 'Vissza',
    'BuildPulse': 'BuildPulse',
    'Cancel reply': 'Valasz megszakitasa',
    'Check in': 'Belepes',
    'Check out': 'Kilepes',
    'Close': 'Bezar',
    'Completed': 'Lezart',
    'Connected': 'Csatlakozva',
    'Conversations': 'Beszelgetesek',
    'Delete attendance': 'Jelenlet torlese',
    'Delete attendance for {name}?': 'Toroljuk {name} jelenletet?',
    'Delete {name}? This action cannot be undone.':
        'Toroljuk {name} nevut? Ez a muvelet nem visszavonhato.',
    'Delete worker': 'Dolgozo torlese',
    'Email': 'Email',
    'Existing printed codes will stop working.':
        'A mar kinyomtatott kodok nem fognak mukodni.',
    'Export': 'Export',
    'Exporting...': 'Exportalas...',
    'Failed to add attendance.': 'A jelenlet hozzaadasa nem sikerult.',
    'Failed to create chat.': 'A chat letrehozasa nem sikerult.',
    'Failed to export attendance.': 'A jelenlet exportalasa nem sikerult.',
    'Failed to load attendance.': 'A jelenlet betoltese nem sikerult.',
    'Failed to load documents.': 'A dokumentumok betoltese nem sikerult.',
    'Failed to load this workpoint.': 'Ez a munkapont nem toltheto be.',
    'Failed to load workers.': 'A dolgozok betoltese nem sikerult.',
    'Failed to set checkout.': 'A kilepes beallitasa nem sikerult.',
    'Failed to update worker.': 'A dolgozo frissitese nem sikerult.',
    'Failed to upload attachment.': 'A csatolmany feltoltese nem sikerult.',
    'Filter records and export the same period to Excel.':
        'Szurd a bejegyzeseket es exportald ugyanazt az idoszakot Excelbe.',
    'From': 'Tol',
    'Hourly wage (RON)': 'Oraber (RON)',
    'Hours: {value}': 'Orak: {value}',
    'Loading attendance...': 'Jelenlet betoltese...',
    'Loading conversations...': 'Beszelgetesek betoltese...',
    'Loading messages...': 'Uzenetek betoltese...',
    'Loading workpoint...': 'Munkapont betoltese...',
    'Loading workers...': 'Dolgozok betoltese...',
    'Manual attendance': 'Manualis jelenlet',
    'Manual entry': 'Manualis bejegyzes',
    'Manage registered workers and their documents.':
        'Kezeld a regisztralt dolgozokat es dokumentumaikat.',
    'New conversation': 'Uj beszelgetes',
    'No conversations': 'Nincsenek beszelgetesek',
    'No messages yet': 'Meg nincsenek uzenetek',
    'No users found': 'Nincsenek talalatok',
    'No wage': 'Nincs ber',
    'No workers assigned to this workpoint.':
        'Nincs dolgozo hozzarendelve ehhez a munkaponthoz.',
    'No workers available to assign.':
        'Nincs elerheto dolgozo a hozzarendeleshez.',
    'No workers registered yet': 'Meg nincsenek regisztralt dolgozok',
    'Not checked out yet': 'Meg nincs kilepes rogzitve',
    'Offline': 'Offline',
    'Open QR': 'QR megnyitasa',
    'QR check-in': 'QR belepes',
    'QR code is not available yet.': 'A QR-kod meg nem elerheto.',
    'QR link copied.': 'A QR link masolva.',
    'Records {count}': 'Bejegyzesek {count}',
    'Remove': 'Eltavolit',
    'Remove {name} from this workpoint?':
        'Eltavolitod {name} nevu dolgozot a munkapontrol?',
    'Remove worker': 'Dolgozo eltavolitasa',
    'Replying to {name}: {message}': 'Valasz {name} uzenetere: {message}',
    'Rotate': 'Forgatas',
    'Rotate QR code': 'QR kod forgatasa',
    'Search conversations': 'Beszelgetesek keresese',
    'Search users': 'Felhasznalok keresese',
    'Send': 'Kuldes',
    'Set checkout': 'Kilepes beallitasa',
    'Start a direct chat or wait for a workpoint chat.':
        'Indits kozvetlen csevegetest vagy varj a munkapont chatre.',
    'Time': 'Ido',
    'To': 'Ig',
    'Typing...': 'Geplel...',
    'Worker': 'Dolgozo',
    'Workers {count}': 'Dolgozok {count}',
    'Workers scan this code to check in or out.':
        'A dolgozok ezzel a koddal lepnek be vagy ki.',
    'Worker not found': 'A dolgozo nem talalhato',
    'Workpoint details': 'Munkapont reszletei',
    'Work point not found': 'A munkapont nem talalhato',
    'Workpoint not found': 'Munkapont nem talalhato',
    'Attendance record not found': 'A jelenleti bejegyzes nem talalhato',
    'Document not found': 'A dokumentum nem talalhato',
    'Document file not found': 'A dokumentum fajlja nem talalhato',
    'One or more workers were not found': 'Egy vagy tobb dolgozo nem talalhato',
    'Only users with the WORKER role can be assigned':
        'Csak WORKER szerepkoru felhasznalok rendelhetok hozza',
    'workerId is required': 'A workerId kotelezo',
    'This workpoint does not have coordinates set':
        'Ehhez a munkaponthoz nincsenek beallitva koordinatak',
    'You are not assigned to this workpoint':
        'Nem vagy ehhez a munkaponthoz hozzarendelve',
    'You must be within 100m of this workpoint to scan attendance':
        'A jelenlet szkenneleshez 100 meteren belul kell lenned ehhez a munkaponthoz',
    'A user with this email already exists':
        'Mar letezik felhasznalo ezzel az email cimmel',
    'Invitation not found': 'A meghivo nem talalhato',
    'Invitation already accepted': 'A meghivot mar elfogadtak',
    'Cannot chat with yourself': 'Nem indithatsz chatet sajat magaddal',
    'Must be a valid UUID': 'Ervenyes UUID szukseges',
    'Must be a valid ISO datetime': 'Ervenyes ISO datum-es-idopont szukseges',
    'At least one field is required': 'Legalabb egy mezot meg kell adni',
    'Invalid request payload.': 'Ervenytelen kerelemadatok.',
    'Workpoints {count}': 'Munkapontok {count}',
    'Write a message...': 'Irj egy uzenetet...',
    '{amount} RON/h': '{amount} RON/ora',
    'Leave Calendar': 'Szabadsag naptar',
    'Select a leave period directly on the calendar.':
        'Valassz ki egy szabadsag idoszakot kozvetlenul a naptaron.',
    'Review employee leave requests and approved absences.':
        'Vizsgald at a dolgozoi szabadsagkerelmeket es a jovahagyott tavolleeket.',
    'Loading leave requests...': 'Szabadsagkerelmek betoltese...',
    'Failed to load leave requests.':
        'A szabadsagkerelmek betoltese nem sikerult.',
    'You cannot select past dates.': 'Nem valaszthatsz multbeli datumokat.',
    'End date cannot be before start date':
        'A befejezo datum nem lehet korabban, mint a kezdo datum.',
    'This period overlaps with an existing request.':
        'Ez az idoszak atfedi egy meglevo kerelmet.',
    'Please select a start and end date.':
        'Kerlek valassz kezdodatumot es vegdatumot.',
    'Please choose a leave type.': 'Kerlek valassz szabadsagtipust.',
    'Leave request submitted.': 'Szabadsagkerelmet elkuldtuk.',
    'User not found': 'A felhasznalo nem talalhato',
    'Admins cannot create leave requests':
        'Az adminisztratorok nem hozhatnak letre szabadsagkereseket',
    'Only admins and leaders can review requests':
        'Csak adminisztratorok es csapatvezetok biralhatnak el kerelmeket',
    'Failed to submit leave request.':
        'A szabadsagkeres elkuldese nem sikerult.',
    'Leave request approved.': 'A szabadsagkeres jovahagyva.',
    'Leave request not found': 'A szabadsagkeres nem talalhato',
    'You cannot review your own leave request':
        'Nem biralhatod el a sajat szabadsagkerelmedet',
    'Only pending requests can be reviewed':
        'Csak fuggoben levo kerelmek biralhatok el',
    'Failed to approve leave request.':
        'A szabadsagkeres jovahagyasa nem sikerult.',
    'Leave request rejected.': 'A szabadsagkeres elutasitva.',
    'Failed to reject leave request.':
        'A szabadsagkeres elutasitasa nem sikerult.',
    'Cancel request': 'Kerelmet torol',
    'Cancel this pending request?': 'Toroljuk ezt a fuggoben levo kerelmet?',
    'Leave request canceled.': 'A szabadsagkeres torolve.',
    'You can only cancel your own requests':
        'Csak a sajat kerelmeidet torolheted',
    'Only pending requests can be canceled':
        'Csak a fuggoben levo kerelmek torolhetok',
    'Failed to cancel leave request.': 'A szabadsagkeres torlese nem sikerult.',
    'Click a start date, then an end date.':
        'Kattints egy kezdo datumra, majd egy vegdatumra.',
    'Approved leave is highlighted on the calendar.':
        'A jovahagyott szabadsag ki van emelve a naptaron.',
    'Previous month': 'Elozo honap',
    'Next month': 'Kovetkezo honap',
    'Mon': 'Het',
    'Tue': 'Ked',
    'Wed': 'Sze',
    'Thu': 'Csu',
    'Fri': 'Pent',
    'Sat': 'Szo',
    'Sun': 'Vas',
    'New leave request': 'Uj szabadsagkeres',
    'Select dates and lock the period for approval.':
        'Valassz datumokat es rogzitsd az idoszakot jovahagyasra.',
    'Vacation leave': 'Szabadsag',
    'Sick leave': 'Betegszabadsag',
    'Leave type': 'Szabadsag tipusa',
    'Not selected': 'Nincs kivalasztva',
    'Start date': 'Kezdo datum',
    'End date': 'Vegdatum',
    'Submitting...': 'Kuldese folyamatban...',
    'Submit request': 'Kerelmet kuld',
    'Clear': 'Torles',
    'Pending approvals': 'Fuggoben levo jovahagyasok',
    'Requests waiting for a manager decision.':
        'A vezeto dontesere varo kerelmek.',
    'No pending requests.': 'Nincsenek fuggoben levo kerelmek.',
    'All leave requests': 'Osszes szabadsagkeres',
    'Your leave requests': 'Sajat szabadsagkereseid',
    'Approved and rejected requests stay visible here.':
        'A jovahagyott es elutasitott kerelmek itt maradnak.',
    'Track your submitted leave requests and approval status.':
        'Kovesd a bekuldott szabadsagkerelmeket es a jovahagyas statuszat.',
    'No reviewed leave requests yet.': 'Meg nincsenek elbiralt kerelmek.',
    'No leave requests yet.': 'Meg nincsenek szabadsagkerelmek.',
    'Approved': 'Jovahagyva',
    'Rejected': 'Elutasitva',
    'Submitted': 'Bekuldve',
    'Approve': 'Jovahagy',
    'Reject': 'Elutasit',
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
      _messages[language]?[key] ?? _messages[AppLanguage.english]?[key] ?? key;
  if (params == null || params.isEmpty) return template;

  var result = template;
  for (final entry in params.entries) {
    result = result.replaceAll('{${entry.key}}', entry.value);
  }
  return result;
}
