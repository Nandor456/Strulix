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
    'Address': 'Adresă',
    'Address is required.': 'Adresa este obligatorie.',
    'Already have an account? Sign in': 'Ai deja un cont? Autentifică-te',
    'Allow location access to scan attendance.':
        'Permite accesul la locație pentru a înregistra prezența.',
    'Ask an admin to set your wage':
        'Cere unui administrator să îți seteze salariul',
    'Attendance': 'Prezență',
    'Attendance scan': 'Scanare prezență',
    'Attendance, hours, assigned workpoints, and wage-based earnings.':
        'Prezență, ore, puncte de lucru alocate și câștiguri calculate pe baza salariului.',
    'ACCEPTED': 'Acceptată',
    'Checked in': 'Intrare înregistrată',
    'Checked in at': 'Ora intrării',
    'Checked out': 'Ieșire înregistrată',
    'Check-ins and check-outs': 'Intrări și ieșiri',
    'Change language': 'Schimbă limba',
    'Choose deadline': 'Alege termenul-limită',
    'Cancel': 'Anulează',
    'Completed attendances': 'Prezențe finalizate',
    'Confirm': 'Confirmă',
    'Coordinates are generated automatically from the address.':
        'Coordonatele sunt generate automat din adresă.',
    'Copy link': 'Copiază linkul',
    'Create account': 'Creează cont',
    'Creating account...': 'Se creează contul...',
    'Create workpoint': 'Creează punct de lucru',
    'Create your account': 'Creează-ți contul',
    'Created {date}': 'Creat la {date}',
    'Current workpoints assigned to you.':
        'Punctele de lucru care îți sunt alocate acum.',
    'Dark theme': 'Temă închisă',
    'Date': 'Data',
    'Days': 'Zile',
    'Deadline': 'Termen-limită',
    'Deadline {date}': 'Termen-limită: {date}',
    'Delete': 'Șterge',
    'Delete document': 'Șterge documentul',
    'Delete workpoint': 'Șterge punctul de lucru',
    'Delete {name}?': 'Ștergi {name}?',
    'Delete {name}? Attendance, assignments, and the workpoint chat will be removed.':
        'Ștergi {name}? Prezența, alocările și chatul punctului de lucru vor fi eliminate.',
    'Description': 'Descriere',
    'Documents': 'Documente',
    'Done': 'Gata',
    'Earnings': 'Câștiguri',
    'Edit': 'Editează',
    'Edit workpoint': 'Editează punctul de lucru',
    'Email address': 'Adresă de email',
    'Email is required.': 'Emailul este obligatoriu.',
    'Please enter a valid email address.':
        'Te rugăm să introduci o adresă de email validă.',
    'Email must be at most 254 characters.':
        'Emailul poate avea cel mult 254 de caractere.',
    'Expires {date}': 'Expiră la {date}',
    'Failed to load invitations.': 'Invitațiile nu au putut fi încărcate.',
    'Failed to open attachment.': 'Atașamentul nu a putut fi deschis.',
    'Failed to load workpoints.': 'Punctele de lucru nu au putut fi încărcate.',
    'Failed to load workpoint documents.':
        'Documentele punctului de lucru nu au putut fi încărcate.',
    'Failed to load your documents.':
        'Documentele tale nu au putut fi încărcate.',
    'Failed to load your worker dashboard.':
        'Tabloul tău de bord nu a putut fi încărcat.',
    'Failed to save workpoint.': 'Punctul de lucru nu a putut fi salvat.',
    'Failed to send invitation.': 'Invitația nu a putut fi trimisă.',
    'Failed to upload document.': 'Documentul nu a putut fi încărcat.',
    'File': 'Fișier',
    'Home': 'Acasă',
    'Hourly wage': 'Salariu pe oră',
    'Hours': 'Ore',
    'Image': 'Imagine',
    'Invalid QR code.': 'Cod QR invalid.',
    'Invalid date': 'Dată invalidă',
    'Initial workers': 'Muncitori inițiali',
    'Invite a new user': 'Invită un utilizator nou',
    'Invite new users by email. Each invitation carries a role and one-time registration link.':
        'Invită utilizatori noi prin email. Fiecare invitație include un rol și un link unic de înregistrare.',
    'Invitation link copied.': 'Linkul invitației a fost copiat.',
    'Join the Construction ERP system':
        'Alătură-te sistemului ERP pentru construcții',
    'LEADER': 'Șef echipă',
    'Loading dashboard...': 'Se încarcă tabloul de bord...',
    'Loading documents...': 'Se încarcă documentele...',
    'Loading invitations...': 'Se încarcă invitațiile...',
    'Loading preview...': 'Se încarcă previzualizarea...',
    'Loading workpoints...': 'Se încarcă punctele de lucru...',
    'Location access is blocked. Enable it in device settings to scan attendance.':
        'Accesul la locație este blocat. Activează-l din setările dispozitivului pentru a înregistra prezența.',
    'Location timed out. Move somewhere with a clearer signal and try again.':
        'Locația a expirat. Mergi într-un loc cu semnal mai bun și încearcă din nou.',
    'Are you sure you want to log out?':
        'Ești sigur că vrei să te deconectezi?',
    'Light theme': 'Temă deschisă',
    'Login failed': 'Autentificarea a eșuat',
    'Log out': 'Deconectare',
    'Messages': 'Mesaje',
    'Missing checkout': 'Ieșire lipsă',
    'Must start with an uppercase letter and be at least 6 characters.':
        'Trebuie să înceapă cu o literă mare și să aibă cel puțin 6 caractere.',
    'Name': 'Nume',
    'Name and address are required.': 'Numele și adresa sunt obligatorii.',
    'Name is required.': 'Numele este obligatoriu.',
    'Network error. Please check the API connection.':
        'Eroare de rețea. Verifică conexiunea la API.',
    'No attendance recorded here for {periodLabel}.':
        'Nu există prezență înregistrată aici pentru {periodLabel}.',
    'No attendance records': 'Fără înregistrări de prezență',
    'No attendance records for {periodLabel}.':
        'Nu există înregistrări de prezență pentru {periodLabel}.',
    'New workpoint': 'Punct de lucru nou',
    'No account? Register': 'Nu ai cont? Înregistrează-te',
    'No documents': 'Fără documente',
    'No documents have been shared with you yet.':
        'Nu au fost distribuite documente pentru tine încă.',
    'No documents uploaded for this workpoint.':
        'Nu există documente încărcate pentru acest punct de lucru.',
    'No invitations': 'Fără invitații',
    'No invitations yet.': 'Nu există invitații încă.',
    'No workers available.': 'Nu există muncitori disponibili.',
    'No workpoints assigned': 'Nu ai puncte de lucru alocate',
    'No workpoints yet': 'Nu există puncte de lucru încă',
    'Not set': 'Nesetat',
    'Open': 'Deschide',
    'Open attachment': 'Deschide atașamentul',
    'Open records': 'Înregistrări deschise',
    'Open theme': 'Deschide tema',
    'PDF': 'PDF',
    'PENDING': 'În așteptare',
    'Pending': 'În așteptare',
    'Password': 'Parolă',
    'Password does not match the rules.': 'Parola nu respectă regulile.',
    'Password is required.': 'Parola este obligatorie.',
    'Password must start with an uppercase letter.':
        'Parola trebuie să înceapă cu o literă mare.',
    'Password must be at least 6 characters.':
        'Parola trebuie să aibă cel puțin 6 caractere.',
    'Password must be at most 100 characters.':
        'Parola poate avea cel mult 100 de caractere.',
    'Please enter a username.': 'Introdu un nume de utilizator.',
    'Preview and download documents shared with your worker profile.':
        'Previzualizează și descarcă documentele distribuite profilului tău de muncitor.',
    'Preview is not available for this file.':
        'Previzualizarea nu este disponibilă pentru acest fișier.',
    'Refresh': 'Reîncarcă',
    'Register': 'Înregistrare',
    'Registration failed': 'Înregistrarea a eșuat',
    'Username already taken': 'Numele de utilizator este deja folosit.',
    'Username must be at most 50 characters.':
        'Numele de utilizator poate avea cel mult 50 de caractere.',
    'An invitation token is required to register':
        'Este necesar un token de invitație pentru înregistrare.',
    'Invitation is invalid, expired, or does not match this email':
        'Invitația este invalidă, expirată sau nu se potrivește cu acest email.',
    'Invitation token cannot be empty.':
        'Tokenul de invitație nu poate fi gol.',
    'Invitation token is too long.': 'Tokenul de invitație este prea lung.',
    'Recording attendance...': 'Se înregistrează prezența...',
    'Revoke': 'Revocă',
    'Role': 'Rol',
    'Previous': 'Anterior',
    'REVOKED': 'Revocată',
    'Scan result': 'Rezultatul scanării',
    'Scan a BuildPulse attendance QR code.':
        'Scanează un cod QR de prezență BuildPulse.',
    'Place the attendance QR code inside the frame.':
        'Așază codul QR de prezență în interiorul cadrului.',
    'EXPIRED': 'Expirată',
    'Save': 'Salvează',
    'Saving...': 'Se salvează...',
    'Scan attendance': 'Scanează prezența',
    'Scan QR': 'Scanează QR',
    'Send invitation': 'Trimite invitația',
    'Sending...': 'Se trimite...',
    'Sent {date}': 'Trimis la {date}',
    'Sign in': 'Autentificare',
    'Signing in...': 'Se autentifică...',
    'Something went wrong.': 'Ceva nu a mers bine.',
    'Tap Open to preview this PDF.':
        'Apasă pe Deschide pentru a previzualiza acest PDF.',
    'This attendance was automatically closed at 22:00 and may need review.':
        'Această prezență a fost închisă automat la 22:00 și poate necesita verificare.',
    'Already completed today': 'Deja finalizată astăzi',
    'Turn on location services to scan attendance.':
        'Pornește serviciile de localizare pentru a înregistra prezența.',
    'Try again': 'Încearcă din nou',
    'Unable to record attendance.': 'Prezența nu a putut fi înregistrată.',
    'Unavailable': 'Indisponibil',
    'Upload': 'Încarcă',
    'Uploading...': 'Se încarcă...',
    'Uploaded {date}': 'Încărcat la {date}',
    'Use the form above to invite your first user.':
        'Folosește formularul de mai sus pentru a invita primul utilizator.',
    'User Invitations': 'Invitații utilizatori',
    'Username': 'Nume utilizator',
    'Username must be at least 3 characters.':
        'Numele de utilizator trebuie să aibă cel puțin 3 caractere.',
    'View and manage workpoints': 'Vezi și gestionează punctele de lucru',
    'Welcome back to BuildPulse': 'Bine ai revenit la BuildPulse',
    'WORKER': 'Muncitor',
    'Workers': 'Muncitori',
    'Workpoint': 'Punct de lucru',
    'Workpoint documents': 'Documente punct de lucru',
    'Workpoints': 'Puncte de lucru',
    'Worker profile': 'Profil muncitor',
    '{count} complete': '{count} finalizate',
    '{count} complete days': '{count} zile complete',
    '{hours} · {count} records': '{hours} · {count} înregistrări',
    'Assigned workpoints': 'Puncte de lucru alocate',
    'Attendance by workpoint': 'Prezență pe punct de lucru',
    'Your own check-ins and check-outs for {periodLabel}.':
        'Intrările și ieșirile tale pentru {periodLabel}.',
    'Your assignments will show up here.': 'Atribuirile tale vor apărea aici.',
    'Your BuildPulse home': 'Panoul tău BuildPulse',
    'Your documents': 'Documentele tale',
    'You are accepting an invitation. Your role will be assigned.':
        'Accepți o invitație. Rolul tău va fi atribuit automat.',
    'Browse job sites and manage workers, attendance, and QR tools.':
        'Răsfoiește șantierele și gestionează muncitorii, prezența și instrumentele QR.',
    'by {name}': 'de {name}',
    'Create one to start assigning workers.':
        'Creează unul pentru a începe alocarea muncitorilor.',
    'Active': 'Activ',
    'Actions': 'Acțiuni',
    'Add': 'Adaugă',
    'Assign a worker before adding attendance.':
        'Alocă un muncitor înainte de a adăuga prezența.',
    'Assign worker': 'Alocă muncitor',
    'Assigned workers': 'Muncitori alocați',
    'Attach file': 'Atașează fișier',
    'Attachment': 'Atașament',
    'Attachment link is invalid.': 'Linkul atașamentului este invalid.',
    'Attachment: {name}': 'Atașament: {name}',
    'Back': 'Înapoi',
    'BuildPulse': 'BuildPulse',
    'Cancel reply': 'Anulează răspunsul',
    'Check in': 'Intrare',
    'Check out': 'Ieșire',
    'Close': 'Închide',
    'Completed': 'Finalizat',
    'Connected': 'Conectat',
    'Conversations': 'Conversații',
    'Delete attendance': 'Șterge prezența',
    'Delete attendance for {name}?': 'Ștergi prezența pentru {name}?',
    'Delete {name}? This action cannot be undone.':
        'Ștergi {name}? Această acțiune nu poate fi anulată.',
    'Delete worker': 'Șterge muncitor',
    'Documents for {name}': 'Documente pentru {name}',
    'Email': 'Email',
    'Existing printed codes will stop working.':
        'Codurile tipărite existente nu vor mai funcționa.',
    'Export': 'Exportă',
    'Exporting...': 'Se exportă...',
    'Failed to add attendance.': 'Prezența nu a putut fi adăugată.',
    'Failed to create chat.': 'Chatul nu a putut fi creat.',
    'Failed to export attendance.': 'Prezența nu a putut fi exportată.',
    'Failed to load attendance.': 'Prezența nu a putut fi încărcată.',
    'Failed to load documents.': 'Documentele nu au putut fi încărcate.',
    'Failed to load this workpoint.':
        'Acest punct de lucru nu a putut fi încărcat.',
    'Failed to load workers.': 'Muncitorii nu au putut fi încărcați.',
    'Failed to set checkout.': 'Ieșirea nu a putut fi setată.',
    'Failed to update worker.': 'Muncitorul nu a putut fi actualizat.',
    'Failed to upload attachment.': 'Atașamentul nu a putut fi încărcat.',
    'Filter records and export the same period to Excel.':
        'Filtrează înregistrările și exportă aceeași perioadă în Excel.',
    'From': 'De la',
    'Hourly wage (RON)': 'Salariu pe oră (RON)',
    'Hours: {value}': 'Ore: {value}',
    'Loading attendance...': 'Se încarcă prezența...',
    'Loading conversations...': 'Se încarcă conversațiile...',
    'Loading messages...': 'Se încarcă mesajele...',
    'Loading workpoint...': 'Se încarcă punctul de lucru...',
    'Loading workers...': 'Se încarcă muncitorii...',
    'Manual attendance': 'Prezență manuală',
    'Manual entry': 'Intrare manuală',
    'Manage registered workers and their documents.':
        'Gestionează muncitorii înregistrați și documentele lor.',
    'New conversation': 'Conversație nouă',
    'No conversations': 'Nicio conversație',
    'No messages yet': 'Niciun mesaj încă',
    'No users found': 'Nu s-au găsit utilizatori',
    'No wage': 'Fără salariu',
    'No workers assigned to this workpoint.':
        'Nu sunt muncitori alocați acestui punct de lucru.',
    'No workers available to assign.':
        'Nu există muncitori disponibili de alocat.',
    'No workers registered yet': 'Nu există muncitori înregistrați încă',
    'Not checked out yet': 'Ieșire neînregistrată încă',
    'Offline': 'Offline',
    'Open QR': 'Deschide QR',
    'QR check-in': 'Check-in QR',
    'QR code is not available yet.': 'Codul QR nu este disponibil încă.',
    'QR link copied.': 'Linkul QR a fost copiat.',
    'Records {count}': 'Înregistrări {count}',
    'Remove': 'Elimină',
    'Remove {name} from this workpoint?':
        'Elimini {name} de la acest punct de lucru?',
    'Remove worker': 'Elimină muncitor',
    'Replying to {name}: {message}': 'Răspunzi lui {name}: {message}',
    'Rotate': 'Rotește',
    'Rotate QR code': 'Rotește codul QR',
    'Search conversations': 'Caută conversații',
    'Search users': 'Caută utilizatori',
    'Send': 'Trimite',
    'Set checkout': 'Setează ieșirea',
    'Start a direct chat or wait for a workpoint chat.':
        'Pornește un chat direct sau așteaptă un chat de punct de lucru.',
    'Time': 'Ora',
    'To': 'Până la',
    'Typing...': 'Tastează...',
    'Worker': 'Muncitor',
    'Workers {count}': 'Muncitori {count}',
    'Workers scan this code to check in or out.':
        'Muncitorii scanează acest cod pentru a intra sau ieși.',
    'Worker not found': 'Muncitorul nu a fost găsit',
    'Workpoint details': 'Detalii punct de lucru',
    'Work point not found': 'Punctul de lucru nu a fost găsit',
    'Workpoint not found': 'Punctul de lucru nu a fost găsit',
    'Attendance record not found': 'Înregistrarea de prezență nu a fost găsită',
    'Document not found': 'Documentul nu a fost găsit',
    'Document file not found': 'Fișierul documentului nu a fost găsit',
    'One or more workers were not found':
        'Unul sau mai mulți muncitori nu au fost găsiți',
    'Only users with the WORKER role can be assigned':
        'Doar utilizatorii cu rolul WORKER pot fi alocați',
    'workerId is required': 'workerId este obligatoriu',
    'This workpoint does not have coordinates set':
        'Acest punct de lucru nu are coordonate setate',
    'You are not assigned to this workpoint':
        'Nu ești alocat la acest punct de lucru',
    'You must be within 100m of this workpoint to scan attendance':
        'Trebuie să fii la cel mult 100 m de acest punct de lucru pentru a scana prezența',
    'A user with this email already exists':
        'Există deja un utilizator cu acest email',
    'Invitation not found': 'Invitația nu a fost găsită',
    'Invitation already accepted': 'Invitația a fost deja acceptată',
    'Cannot chat with yourself': 'Nu poți deschide un chat cu tine însuți',
    'Must be a valid UUID': 'Trebuie să fie un UUID valid',
    'Must be a valid ISO datetime': 'Trebuie să fie o dată și oră ISO validă',
    'At least one field is required': 'Este necesar cel puțin un câmp',
    'Invalid request payload.': 'Datele cererii sunt invalide.',
    'Workpoints {count}': 'Puncte de lucru {count}',
    'Write a message...': 'Scrie un mesaj...',
    '{amount} RON/h': '{amount} RON/oră',
    'Leave Calendar': 'Calendar concedii',
    'Select a leave period directly on the calendar.':
        'Selectează o perioadă de concediu direct în calendar.',
    'Review employee leave requests and approved absences.':
        'Revizuiește cererile de concediu ale angajaților și absențele aprobate.',
    'Loading leave requests...': 'Se încarcă cererile de concediu...',
    'Failed to load leave requests.':
        'Cererile de concediu nu au putut fi încărcate.',
    'You cannot select past dates.': 'Nu poți selecta date din trecut.',
    'End date cannot be before start date':
        'Data de sfârșit nu poate fi înaintea datei de început.',
    'This period overlaps with an existing request.':
        'Această perioadă se suprapune cu o cerere existentă.',
    'Please select a start and end date.':
        'Te rugăm să selectezi o dată de început și una de sfârșit.',
    'Please choose a leave type.': 'Te rugăm să alegi un tip de concediu.',
    'Leave request submitted.': 'Cererea de concediu a fost trimisă.',
    'User not found': 'Utilizatorul nu a fost găsit',
    'Admins cannot create leave requests':
        'Administratorii nu pot crea cereri de concediu',
    'Only admins and leaders can review requests':
        'Doar administratorii și șefii de echipă pot revizui cererile',
    'Failed to submit leave request.':
        'Cererea de concediu nu a putut fi trimisă.',
    'Leave request approved.': 'Cererea de concediu a fost aprobată.',
    'Leave request not found': 'Cererea de concediu nu a fost găsită',
    'You cannot review your own leave request':
        'Nu îți poți revizui propria cerere de concediu',
    'Only pending requests can be reviewed':
        'Doar cererile în așteptare pot fi revizuite',
    'Failed to approve leave request.':
        'Cererea de concediu nu a putut fi aprobată.',
    'Leave request rejected.': 'Cererea de concediu a fost respinsă.',
    'Failed to reject leave request.':
        'Cererea de concediu nu a putut fi respinsă.',
    'Cancel request': 'Anulează cererea',
    'Cancel this pending request?': 'Anulezi această cerere în așteptare?',
    'Leave request canceled.': 'Cererea de concediu a fost anulată.',
    'You can only cancel your own requests':
        'Poți anula doar propriile tale cereri',
    'Only pending requests can be canceled':
        'Doar cererile în așteptare pot fi anulate',
    'Failed to cancel leave request.':
        'Cererea de concediu nu a putut fi anulată.',
    'Click a start date, then an end date.':
        'Apasă o dată de început, apoi o dată de sfârșit.',
    'Approved leave is highlighted on the calendar.':
        'Concediile aprobate sunt evidențiate în calendar.',
    'Previous month': 'Luna anterioară',
    'Next month': 'Luna următoare',
    'Mon': 'Lun',
    'Tue': 'Mar',
    'Wed': 'Mie',
    'Thu': 'Joi',
    'Fri': 'Vin',
    'Sat': 'Sâm',
    'Sun': 'Dum',
    'New leave request': 'Cerere nouă de concediu',
    'Select dates and lock the period for approval.':
        'Selectează datele și blochează perioada pentru aprobare.',
    'Vacation leave': 'Concediu de odihnă',
    'Sick leave': 'Concediu medical',
    'Leave type': 'Tip concediu',
    'Not selected': 'Neselectat',
    'Start date': 'Data de început',
    'End date': 'Data de sfârșit',
    'Submitting...': 'Se trimite...',
    'Submit request': 'Trimite cererea',
    'Clear': 'Golește',
    'Pending approvals': 'Aprobări în așteptare',
    'Requests waiting for a manager decision.':
        'Cereri în așteptarea unei decizii de la manager.',
    'No pending requests.': 'Nu există cereri în așteptare.',
    'All leave requests': 'Toate cererile de concediu',
    'Your leave requests': 'Cererile tale de concediu',
    'Approved and rejected requests stay visible here.':
        'Cererile aprobate și respinse rămân vizibile aici.',
    'Track your submitted leave requests and approval status.':
        'Urmărește cererile de concediu trimise și statusul aprobării.',
    'No reviewed leave requests yet.': 'Nu există cereri revizuite încă.',
    'No leave requests yet.': 'Nu există cereri de concediu încă.',
    'Approved': 'Aprobată',
    'Rejected': 'Respinsă',
    'Submitted': 'Trimisă',
    'Approve': 'Aprobă',
    'Reject': 'Respinge',
  },
  AppLanguage.hungarian: {
    'Address': 'Cím',
    'Address is required.': 'A cím megadása kötelező.',
    'Already have an account? Sign in': 'Már van fiókod? Lépj be',
    'Allow location access to scan attendance.':
        'Engedélyezd a helyhozzáférést a jelenlét rögzítéséhez.',
    'Ask an admin to set your wage':
        'Kérj meg egy adminisztrátort, hogy állítsa be a béredet',
    'Attendance': 'Jelenlét',
    'Attendance scan': 'Jelenlét szkennelése',
    'Attendance, hours, assigned workpoints, and wage-based earnings.':
        'Jelenlét, órák, kijelölt munkapontok és béralapú keresetek.',
    'ACCEPTED': 'Elfogadva',
    'Checked in': 'Belépés rögzítve',
    'Checked in at': 'Belépés ideje',
    'Checked out': 'Kilépés rögzítve',
    'Check-ins and check-outs': 'Belépések és kilépések',
    'Change language': 'Nyelvváltás',
    'Choose deadline': 'Határidő kiválasztása',
    'Cancel': 'Mégse',
    'Completed attendances': 'Lezárt jelenlétek',
    'Confirm': 'Megerősít',
    'Coordinates are generated automatically from the address.':
        'A koordináták automatikusan készülnek a címből.',
    'Copy link': 'Hivatkozás másolása',
    'Create account': 'Fiók létrehozása',
    'Creating account...': 'Fiók létrehozása folyamatban...',
    'Create workpoint': 'Munkapont létrehozása',
    'Create your account': 'Hozd létre a fiókodat',
    'Created {date}': 'Létrehozva: {date}',
    'Current workpoints assigned to you.':
        'A jelenleg hozzád rendelt munkapontok.',
    'Dark theme': 'Sötét téma',
    'Date': 'Dátum',
    'Days': 'Napok',
    'Deadline': 'Határidő',
    'Deadline {date}': 'Határidő: {date}',
    'Delete': 'Törlés',
    'Delete document': 'Dokumentum törlése',
    'Delete workpoint': 'Munkapont törlése',
    'Delete {name}?': 'Töröljük {name}?',
    'Delete {name}? Attendance, assignments, and the workpoint chat will be removed.':
        'Töröljük ezt: {name}? A jelenlét, a hozzárendelések és a munkapont csevegése is törlődik.',
    'Description': 'Leírás',
    'Documents': 'Dokumentumok',
    'Done': 'Kész',
    'Earnings': 'Kereset',
    'Edit': 'Szerkesztés',
    'Edit workpoint': 'Munkapont szerkesztése',
    'Email address': 'Email-cím',
    'Email is required.': 'Az email-cím kötelező.',
    'Please enter a valid email address.': 'Adj meg egy érvényes email-címet.',
    'Email must be at most 254 characters.':
        'Az email-cím legfeljebb 254 karakter lehet.',
    'Expires {date}': 'Lejár ekkor: {date}',
    'Failed to load invitations.': 'A meghívók betöltése nem sikerült.',
    'Failed to open attachment.': 'A csatolmány megnyitása nem sikerült.',
    'Failed to load workpoints.': 'A munkapontok betöltése nem sikerült.',
    'Failed to load workpoint documents.':
        'A munkapont dokumentumainak betöltése nem sikerült.',
    'Failed to load your documents.': 'A dokumentumok betöltése nem sikerült.',
    'Failed to load your worker dashboard.':
        'A dolgozói áttekintés betöltése nem sikerült.',
    'Failed to save workpoint.': 'A munkapont mentése nem sikerült.',
    'Failed to send invitation.': 'A meghívó küldése nem sikerült.',
    'Failed to upload document.': 'A dokumentum feltöltése nem sikerült.',
    'File': 'Fájl',
    'Home': 'Kezdőlap',
    'Hourly wage': 'Órabér',
    'Hours': 'Órák',
    'Image': 'Kép',
    'Invalid QR code.': 'Érvénytelen QR-kód.',
    'Invalid date': 'Érvénytelen dátum',
    'Initial workers': 'Kezdeti dolgozók',
    'Invite a new user': 'Új felhasználó meghívása',
    'Invite new users by email. Each invitation carries a role and one-time registration link.':
        'Hívj meg új felhasználókat emailben. Minden meghívóhoz szerepkör és egyszer használható regisztrációs link tartozik.',
    'Invitation link copied.': 'A meghívó linkje másolva.',
    'Join the Construction ERP system':
        'Csatlakozz az építőipari ERP-rendszerhez',
    'LEADER': 'Csapatvezető',
    'Loading dashboard...': 'Áttekintés betöltése...',
    'Loading documents...': 'Dokumentumok betöltése...',
    'Loading invitations...': 'Meghívók betöltése...',
    'Loading preview...': 'Előnézet betöltése...',
    'Loading workpoints...': 'Munkapontok betöltése...',
    'Location access is blocked. Enable it in device settings to scan attendance.':
        'A helyhozzáférés le van tiltva. Engedélyezd a készülék beállításaiban a jelenlét rögzítéséhez.',
    'Location timed out. Move somewhere with a clearer signal and try again.':
        'A helymeghatározás időtúllépéssel leállt. Menj jobb jelű helyre, és próbáld újra.',
    'Are you sure you want to log out?': 'Biztosan ki szeretnél jelentkezni?',
    'Light theme': 'Világos téma',
    'Login failed': 'A belépés sikertelen',
    'Log out': 'Kijelentkezés',
    'Messages': 'Üzenetek',
    'Missing checkout': 'Hiányzó kilépés',
    'Must start with an uppercase letter and be at least 6 characters.':
        'Nagybetűvel kell kezdődnie, és legalább 6 karakterből kell állnia.',
    'Name': 'Név',
    'Name and address are required.': 'A név és a cím kötelező.',
    'Name is required.': 'A név kötelező.',
    'Network error. Please check the API connection.':
        'Hálózati hiba. Ellenőrizd az API-kapcsolatot.',
    'No attendance recorded here for {periodLabel}.':
        'Itt nincs rögzített jelenlét erre: {periodLabel}.',
    'No attendance records': 'Nincsenek jelenléti adatok',
    'No attendance records for {periodLabel}.':
        'Nincsenek jelenléti adatok erre: {periodLabel}.',
    'New workpoint': 'Új munkapont',
    'No account? Register': 'Nincs fiókod? Regisztrálj',
    'No documents': 'Nincsenek dokumentumok',
    'No documents have been shared with you yet.':
        'Még nem osztottak meg veled dokumentumokat.',
    'No documents uploaded for this workpoint.':
        'Ehhez a munkaponthoz még nincs feltöltött dokumentum.',
    'No invitations': 'Nincsenek meghívók',
    'No invitations yet.': 'Még nincsenek meghívók.',
    'No workers available.': 'Nincs elérhető dolgozó.',
    'No workpoints assigned': 'Nincs hozzád rendelt munkapont',
    'No workpoints yet': 'Még nincsenek munkapontok',
    'Not set': 'Nincs beállítva',
    'Open': 'Megnyitás',
    'Open attachment': 'Csatolmány megnyitása',
    'Open records': 'Nyitott bejegyzések',
    'Open theme': 'Téma megnyitása',
    'PDF': 'PDF',
    'PENDING': 'Függőben',
    'Pending': 'Függőben',
    'Password': 'Jelszó',
    'Password does not match the rules.':
        'A jelszó nem felel meg a szabályoknak.',
    'Password is required.': 'A jelszó kötelező.',
    'Password must start with an uppercase letter.':
        'A jelszónak nagybetűvel kell kezdődnie.',
    'Password must be at least 6 characters.':
        'A jelszónak legalább 6 karakteresnek kell lennie.',
    'Password must be at most 100 characters.':
        'A jelszó legfeljebb 100 karakter lehet.',
    'Please enter a username.': 'Adj meg egy felhasználónevet.',
    'Preview and download documents shared with your worker profile.':
        'Tekintsd meg és töltsd le a dolgozói profilodhoz megosztott dokumentumokat.',
    'Preview is not available for this file.':
        'Ehhez a fájlhoz nem érhető el előnézet.',
    'Refresh': 'Frissítés',
    'Register': 'Regisztráció',
    'Registration failed': 'A regisztráció sikertelen',
    'Username already taken': 'Ez a felhasználónév már foglalt.',
    'Username must be at most 50 characters.':
        'A felhasználónév legfeljebb 50 karakter lehet.',
    'An invitation token is required to register':
        'A regisztrációhoz meghívó token szükséges.',
    'Invitation is invalid, expired, or does not match this email':
        'A meghívó érvénytelen, lejárt, vagy nem ehhez az email-címhez tartozik.',
    'Invitation token cannot be empty.': 'A meghívó token nem lehet üres.',
    'Invitation token is too long.': 'A meghívó token túl hosszú.',
    'Recording attendance...': 'Jelenlét rögzítése folyamatban...',
    'Revoke': 'Visszavonás',
    'Role': 'Szerepkör',
    'Previous': 'Korábbi',
    'REVOKED': 'Visszavonva',
    'Scan result': 'Szkennelés eredménye',
    'Scan a BuildPulse attendance QR code.':
        'Szkennelj be egy BuildPulse jelenléti QR-kódot.',
    'Place the attendance QR code inside the frame.':
        'Helyezd a jelenléti QR-kódot a keretbe.',
    'EXPIRED': 'Lejárt',
    'Save': 'Mentés',
    'Saving...': 'Mentés folyamatban...',
    'Scan attendance': 'Jelenlét szkennelése',
    'Scan QR': 'QR szkennelése',
    'Send invitation': 'Meghívó küldése',
    'Sending...': 'Küldés...',
    'Sent {date}': 'Elküldve: {date}',
    'Sign in': 'Belépés',
    'Signing in...': 'Belépés folyamatban...',
    'Something went wrong.': 'Valami hiba történt.',
    'Tap Open to preview this PDF.':
        'Érintsd meg a Megnyitás gombot a PDF előnézetéhez.',
    'This attendance was automatically closed at 22:00 and may need review.':
        'Ez a jelenlét automatikusan lezárult 22:00-kor, és ellenőrzésre szorulhat.',
    'Already completed today': 'Ma már lezárva',
    'Turn on location services to scan attendance.':
        'Kapcsold be a helymeghatározást a jelenlét rögzítéséhez.',
    'Try again': 'Próbáld újra',
    'Unable to record attendance.': 'A jelenlét rögzítése nem sikerült.',
    'Unavailable': 'Nem érhető el',
    'Upload': 'Feltöltés',
    'Uploading...': 'Feltöltés...',
    'Uploaded {date}': 'Feltöltve: {date}',
    'Use the form above to invite your first user.':
        'A fenti űrlappal hívhatod meg az első felhasználót.',
    'User Invitations': 'Felhasználói meghívók',
    'Username': 'Felhasználónév',
    'Username must be at least 3 characters.':
        'A felhasználónévnek legalább 3 karakteresnek kell lennie.',
    'View and manage workpoints': 'Munkapontok megtekintése és kezelése',
    'Welcome back to BuildPulse': 'Üdvözöl újra a BuildPulse-ban',
    'WORKER': 'Munkás',
    'Workers': 'Dolgozók',
    'Workpoint': 'Munkapont',
    'Workpoint documents': 'Munkapont dokumentumai',
    'Workpoints': 'Munkapontok',
    'Worker profile': 'Dolgozói profil',
    '{count} complete': '{count} lezárt',
    '{count} complete days': '{count} teljes nap',
    '{hours} · {count} records': '{hours} · {count} bejegyzés',
    'Assigned workpoints': 'Kijelölt munkapontok',
    'Attendance by workpoint': 'Jelenlét munkapontonként',
    'Your own check-ins and check-outs for {periodLabel}.':
        'A saját belépéseid és kilépéseid {periodLabel} időszakban.',
    'Your assignments will show up here.':
        'A hozzárendeléseid itt fognak megjelenni.',
    'Your BuildPulse home': 'A te BuildPulse kezdőlapod',
    'Your documents': 'Saját dokumentumok',
    'You are accepting an invitation. Your role will be assigned.':
        'Egy meghívót fogadsz el. A szerepköröd automatikusan be lesz állítva.',
    'Browse job sites and manage workers, attendance, and QR tools.':
        'Böngéssz a munkaterületek között, és kezeld a dolgozókat, a jelenlétet és a QR-eszközöket.',
    'by {name}': '{name} által',
    'Create one to start assigning workers.':
        'Hozz létre egyet a dolgozók hozzárendeléséhez.',
    'Active': 'Aktív',
    'Actions': 'Műveletek',
    'Add': 'Hozzáad',
    'Assign a worker before adding attendance.':
        'Rendelj hozzá dolgozót, mielőtt jelenlétet adsz hozzá.',
    'Assign worker': 'Dolgozó hozzárendelése',
    'Assigned workers': 'Hozzárendelt dolgozók',
    'Attach file': 'Fájl csatolása',
    'Attachment': 'Csatolmány',
    'Attachment link is invalid.': 'A csatolmány hivatkozása érvénytelen.',
    'Attachment: {name}': 'Csatolmány: {name}',
    'Back': 'Vissza',
    'BuildPulse': 'BuildPulse',
    'Cancel reply': 'Válasz megszakítása',
    'Check in': 'Belépés',
    'Check out': 'Kilépés',
    'Close': 'Bezárás',
    'Completed': 'Lezárt',
    'Connected': 'Csatlakozva',
    'Conversations': 'Beszélgetések',
    'Delete attendance': 'Jelenlét törlése',
    'Delete attendance for {name}?': 'Töröljük {name} jelenlétét?',
    'Delete {name}? This action cannot be undone.':
        'Töröljük {name} nevű elemet? Ez a művelet nem vonható vissza.',
    'Delete worker': 'Dolgozó törlése',
    'Documents for {name}': 'Dokumentumok: {name}',
    'Email': 'Email',
    'Existing printed codes will stop working.':
        'A már kinyomtatott kódok nem fognak működni.',
    'Export': 'Exportálás',
    'Exporting...': 'Exportálás...',
    'Failed to add attendance.': 'A jelenlét hozzáadása nem sikerült.',
    'Failed to create chat.': 'A chat létrehozása nem sikerült.',
    'Failed to export attendance.': 'A jelenlét exportálása nem sikerült.',
    'Failed to load attendance.': 'A jelenlét betöltése nem sikerült.',
    'Failed to load documents.': 'A dokumentumok betöltése nem sikerült.',
    'Failed to load this workpoint.': 'Ez a munkapont nem tölthető be.',
    'Failed to load workers.': 'A dolgozók betöltése nem sikerült.',
    'Failed to set checkout.': 'A kilépés beállítása nem sikerült.',
    'Failed to update worker.': 'A dolgozó frissítése nem sikerült.',
    'Failed to upload attachment.': 'A csatolmány feltöltése nem sikerült.',
    'Filter records and export the same period to Excel.':
        'Szűrd a bejegyzéseket, és exportáld ugyanezt az időszakot Excelbe.',
    'From': 'Tól',
    'Hourly wage (RON)': 'Órabér (RON)',
    'Hours: {value}': 'Órák: {value}',
    'Loading attendance...': 'Jelenlét betöltése...',
    'Loading conversations...': 'Beszélgetések betöltése...',
    'Loading messages...': 'Üzenetek betöltése...',
    'Loading workpoint...': 'Munkapont betöltése...',
    'Loading workers...': 'Dolgozók betöltése...',
    'Manual attendance': 'Manuális jelenlét',
    'Manual entry': 'Manuális bejegyzés',
    'Manage registered workers and their documents.':
        'Kezeld a regisztrált dolgozókat és dokumentumaikat.',
    'New conversation': 'Új beszélgetés',
    'No conversations': 'Nincsenek beszélgetések',
    'No messages yet': 'Még nincsenek üzenetek',
    'No users found': 'Nincsenek találatok',
    'No wage': 'Nincs bér',
    'No workers assigned to this workpoint.':
        'Nincs dolgozó hozzárendelve ehhez a munkaponthoz.',
    'No workers available to assign.':
        'Nincs elérhető dolgozó a hozzárendeléshez.',
    'No workers registered yet': 'Még nincsenek regisztrált dolgozók',
    'Not checked out yet': 'Még nincs kilépés rögzítve',
    'Offline': 'Offline',
    'Open QR': 'QR megnyitása',
    'QR check-in': 'QR-belépés',
    'QR code is not available yet.': 'A QR-kód még nem elérhető.',
    'QR link copied.': 'A QR-link másolva.',
    'Records {count}': 'Bejegyzések: {count}',
    'Remove': 'Eltávolít',
    'Remove {name} from this workpoint?':
        'Eltávolítod {name} nevű dolgozót a munkapontról?',
    'Remove worker': 'Dolgozó eltávolítása',
    'Replying to {name}: {message}': 'Válasz {name} üzenetére: {message}',
    'Rotate': 'Forgatás',
    'Rotate QR code': 'QR-kód forgatása',
    'Search conversations': 'Beszélgetések keresése',
    'Search users': 'Felhasználók keresése',
    'Send': 'Küldés',
    'Set checkout': 'Kilépés beállítása',
    'Start a direct chat or wait for a workpoint chat.':
        'Indíts közvetlen csevegést, vagy várj a munkapont chatre.',
    'Time': 'Idő',
    'To': 'Ig',
    'Typing...': 'Gépel...',
    'Worker': 'Dolgozó',
    'Workers {count}': 'Dolgozók: {count}',
    'Workers scan this code to check in or out.':
        'A dolgozók ezzel a kóddal lépnek be vagy ki.',
    'Worker not found': 'A dolgozó nem található',
    'Workpoint details': 'Munkapont részletei',
    'Work point not found': 'A munkapont nem található',
    'Workpoint not found': 'Munkapont nem található',
    'Attendance record not found': 'A jelenléti bejegyzés nem található',
    'Document not found': 'A dokumentum nem található',
    'Document file not found': 'A dokumentum fájlja nem található',
    'One or more workers were not found': 'Egy vagy több dolgozó nem található',
    'Only users with the WORKER role can be assigned':
        'Csak WORKER szerepkörű felhasználók rendelhetők hozzá',
    'workerId is required': 'A workerId kötelező',
    'This workpoint does not have coordinates set':
        'Ehhez a munkaponthoz nincsenek beállítva koordináták',
    'You are not assigned to this workpoint':
        'Nem vagy ehhez a munkaponthoz hozzárendelve',
    'You must be within 100m of this workpoint to scan attendance':
        'A jelenlét szkenneléséhez 100 méteren belül kell lenned ehhez a munkaponthoz',
    'A user with this email already exists':
        'Már létezik felhasználó ezzel az email-címmel',
    'Invitation not found': 'A meghívó nem található',
    'Invitation already accepted': 'A meghívót már elfogadták',
    'Cannot chat with yourself': 'Nem indíthatsz chatet saját magaddal',
    'Must be a valid UUID': 'Érvényes UUID szükséges',
    'Must be a valid ISO datetime': 'Érvényes ISO-dátum és időpont szükséges',
    'At least one field is required': 'Legalább egy mezőt meg kell adni',
    'Invalid request payload.': 'Érvénytelen kérelemadatok.',
    'Workpoints {count}': 'Munkapontok: {count}',
    'Write a message...': 'Írj egy üzenetet...',
    '{amount} RON/h': '{amount} RON/óra',
    'Leave Calendar': 'Szabadságnaptár',
    'Select a leave period directly on the calendar.':
        'Válassz ki egy szabadságidőszakot közvetlenül a naptáron.',
    'Review employee leave requests and approved absences.':
        'Vizsgáld át a dolgozói szabadságkérelmeket és a jóváhagyott távolléteket.',
    'Loading leave requests...': 'Szabadságkérelmek betöltése...',
    'Failed to load leave requests.':
        'A szabadságkérelmek betöltése nem sikerült.',
    'You cannot select past dates.': 'Nem választhatsz múltbeli dátumokat.',
    'End date cannot be before start date':
        'A befejező dátum nem lehet korábban, mint a kezdő dátum.',
    'This period overlaps with an existing request.':
        'Ez az időszak átfedi egy meglévő kérelmet.',
    'Please select a start and end date.':
        'Kérlek, válassz kezdődátumot és végdátumot.',
    'Please choose a leave type.': 'Kérlek, válassz szabadságtípust.',
    'Leave request submitted.': 'A szabadságkérelmet elküldtük.',
    'User not found': 'A felhasználó nem található',
    'Admins cannot create leave requests':
        'Az adminisztrátorok nem hozhatnak létre szabadságkérelmeket',
    'Only admins and leaders can review requests':
        'Csak adminisztrátorok és csapatvezetők bírálhatnak el kérelmeket',
    'Failed to submit leave request.':
        'A szabadságkérelem elküldése nem sikerült.',
    'Leave request approved.': 'A szabadságkérelem jóváhagyva.',
    'Leave request not found': 'A szabadságkérelem nem található',
    'You cannot review your own leave request':
        'Nem bírálhatod el a saját szabadságkérelmedet',
    'Only pending requests can be reviewed':
        'Csak függőben lévő kérelmek bírálhatók el',
    'Failed to approve leave request.':
        'A szabadságkérelem jóváhagyása nem sikerült.',
    'Leave request rejected.': 'A szabadságkérelem elutasítva.',
    'Failed to reject leave request.':
        'A szabadságkérelem elutasítása nem sikerült.',
    'Cancel request': 'Kérelem törlése',
    'Cancel this pending request?': 'Töröljük ezt a függőben lévő kérelmet?',
    'Leave request canceled.': 'A szabadságkérelem törölve.',
    'You can only cancel your own requests':
        'Csak a saját kérelmeidet törölheted',
    'Only pending requests can be canceled':
        'Csak a függőben lévő kérelmek törölhetők',
    'Failed to cancel leave request.':
        'A szabadságkérelem törlése nem sikerült.',
    'Click a start date, then an end date.':
        'Kattints egy kezdő dátumra, majd egy végdátumra.',
    'Approved leave is highlighted on the calendar.':
        'A jóváhagyott szabadság ki van emelve a naptáron.',
    'Previous month': 'Előző hónap',
    'Next month': 'Következő hónap',
    'Mon': 'Hét',
    'Tue': 'Ked',
    'Wed': 'Sze',
    'Thu': 'Csü',
    'Fri': 'Pén',
    'Sat': 'Szo',
    'Sun': 'Vas',
    'New leave request': 'Új szabadságkérelem',
    'Select dates and lock the period for approval.':
        'Válassz dátumokat, és rögzítsd az időszakot jóváhagyásra.',
    'Vacation leave': 'Szabadság',
    'Sick leave': 'Betegszabadság',
    'Leave type': 'Szabadság típusa',
    'Not selected': 'Nincs kiválasztva',
    'Start date': 'Kezdő dátum',
    'End date': 'Végdátum',
    'Submitting...': 'Küldés folyamatban...',
    'Submit request': 'Kérelem küldése',
    'Clear': 'Törlés',
    'Pending approvals': 'Függőben lévő jóváhagyások',
    'Requests waiting for a manager decision.':
        'A vezető döntésére váró kérelmek.',
    'No pending requests.': 'Nincsenek függőben lévő kérelmek.',
    'All leave requests': 'Összes szabadságkérelem',
    'Your leave requests': 'Saját szabadságkérelmeid',
    'Approved and rejected requests stay visible here.':
        'A jóváhagyott és elutasított kérelmek itt maradnak.',
    'Track your submitted leave requests and approval status.':
        'Kövesd a beküldött szabadságkérelmeket és a jóváhagyás státuszát.',
    'No reviewed leave requests yet.': 'Még nincsenek elbírált kérelmek.',
    'No leave requests yet.': 'Még nincsenek szabadságkérelmek.',
    'Approved': 'Jóváhagyva',
    'Rejected': 'Elutasítva',
    'Submitted': 'Beküldve',
    'Approve': 'Jóváhagy',
    'Reject': 'Elutasít',
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
