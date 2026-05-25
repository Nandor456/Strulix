import 'package:flutter/foundation.dart';

import '../core/api/buildpulse_api.dart';
import '../core/models.dart';

class AuthController extends ChangeNotifier {
  AuthController(this._api) {
    _api.client.onUnauthorized = _handleUnauthorized;
  }

  final BuildPulseApi _api;
  User? _user;
  bool _isLoading = true;
  Future<void> Function()? onBeforeLogout;

  User? get user => _user;

  bool get isLoading => _isLoading;

  bool get isAuthenticated => _user != null;

  bool get isWorker => _user?.role == UserRole.worker;

  bool get canManageWorkPoints =>
      _user?.role == UserRole.admin || _user?.role == UserRole.leader;

  bool get canViewWorkers => canManageWorkPoints;

  bool get canManageUsers => _user?.role == UserRole.admin;

  Future<void> bootstrap() async {
    _isLoading = true;
    try {
      _user = await _api.currentUser();
    } catch (_) {
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshUser() async {
    _user = await _api.currentUser();
    notifyListeners();
  }

  Future<void> login({
    required String username,
    required String password,
  }) async {
    await _api.login(username: username, password: password);
    await refreshUser();
  }

  Future<void> register({
    required String username,
    required String email,
    required String password,
    String? token,
  }) async {
    await _api.register(
      username: username,
      email: email,
      password: password,
      token: token,
    );
    await refreshUser();
  }

  Future<void> logout() async {
    final wasAuthenticated = _user != null;
    final beforeLogout = wasAuthenticated ? onBeforeLogout?.call() : null;
    _user = null;
    if (wasAuthenticated) {
      notifyListeners();
    }
    try {
      await beforeLogout;
    } catch (_) {
      // Logging out should still complete if best-effort cleanup fails.
    }
    await _api.logout();
  }

  void _handleUnauthorized() {
    if (_user == null) return;
    _user = null;
    notifyListeners();
  }
}
