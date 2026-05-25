import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_controller.dart';
import '../auth/auth_pages.dart';
import '../attendance/checkin_page.dart';
import '../attendance/scan_page.dart';
import '../documents/documents_page.dart';
import '../invitations/invitations_page.dart';
import '../messaging/messaging_page.dart';
import '../workers/workers_page.dart';
import '../workpoints/workpoint_detail_page.dart';
import '../workpoints/workpoints_page.dart';
import '../worker_home/worker_home_page.dart';
import 'app_shell.dart';
import 'models.dart';

GoRouter createAppRouter(AuthController auth) {
  return GoRouter(
    refreshListenable: auth,
    initialLocation: '/',
    redirect: (context, state) => buildPulseRedirect(
      isAuthenticated: auth.isAuthenticated,
      role: auth.user?.role,
      uri: state.uri,
    ),
    routes: [
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) => _buildPage(
          state,
          LoginPage(redirectPath: state.uri.queryParameters['redirect']),
        ),
      ),
      GoRoute(
        path: '/register',
        pageBuilder: (context, state) => _buildPage(
          state,
          RegisterPage(
            token: state.uri.queryParameters['token'],
            prefilledEmail: state.uri.queryParameters['email'],
          ),
        ),
      ),
      GoRoute(
        path: '/checkin/:qrToken',
        pageBuilder: (context, state) => _buildPage(
          state,
          CheckinPage(qrToken: state.pathParameters['qrToken'] ?? ''),
        ),
      ),
      ShellRoute(
        pageBuilder: (context, state, child) =>
            _buildPage(state, AppShell(location: state.uri.path, child: child)),
        routes: [
          GoRoute(
            path: '/',
            pageBuilder: (context, state) =>
                _buildPage(state, const HomeRoutePage()),
          ),
          GoRoute(
            path: '/messages',
            pageBuilder: (context, state) => _buildPage(
              state,
              MessagingPage(initialChatId: state.uri.queryParameters['chatId']),
            ),
          ),
          GoRoute(
            path: '/documents',
            pageBuilder: (context, state) =>
                _buildPage(state, const DocumentsPage()),
          ),
          GoRoute(
            path: '/scan',
            pageBuilder: (context, state) =>
                _buildPage(state, const ScanPage()),
          ),
          GoRoute(
            path: '/workpoints',
            pageBuilder: (context, state) =>
                _buildPage(state, const WorkpointsPage()),
          ),
          GoRoute(
            path: '/workpoints/:id',
            pageBuilder: (context, state) => _buildPage(
              state,
              WorkpointDetailPage(id: state.pathParameters['id'] ?? ''),
            ),
          ),
          GoRoute(
            path: '/workers',
            pageBuilder: (context, state) =>
                _buildPage(state, const WorkersPage()),
          ),
          GoRoute(
            path: '/invitations',
            pageBuilder: (context, state) =>
                _buildPage(state, const InvitationsPage()),
          ),
        ],
      ),
    ],
  );
}

Page<void> _buildPage(GoRouterState state, Widget child) {
  return NoTransitionPage<void>(
    key: state.pageKey,
    restorationId: state.pageKey.value,
    child: child,
  );
}

@visibleForTesting
String? buildPulseRedirect({
  required bool isAuthenticated,
  required UserRole? role,
  required Uri uri,
}) {
  final path = uri.path;
  final isAuthRoute = path == '/login' || path == '/register';

  if (!isAuthenticated) {
    if (isAuthRoute) return null;
    final redirect = Uri.encodeComponent(uri.toString());
    return '/login?redirect=$redirect';
  }

  if (isAuthRoute) return '/';

  if (path == '/documents' && role != UserRole.worker) return '/';
  if (path == '/scan' && role != UserRole.worker) return '/';
  if (path.startsWith('/workpoints') &&
      role != UserRole.admin &&
      role != UserRole.leader) {
    return '/';
  }
  if (path == '/workers' && role != UserRole.admin && role != UserRole.leader) {
    return '/';
  }
  if (path == '/invitations' && role != UserRole.admin) return '/';

  return null;
}

class HomeRoutePage extends StatelessWidget {
  const HomeRoutePage({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AppShell.auth(context);
    if (auth.isWorker) return const WorkerHomePage();
    return const WorkpointsPage();
  }
}
