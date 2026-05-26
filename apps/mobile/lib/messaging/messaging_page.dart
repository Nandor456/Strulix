import 'dart:async';
import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:open_filex/open_filex.dart';

import '../core/app_scope.dart';
import '../core/formatters.dart';
import '../core/models.dart';
import '../core/widgets.dart';

class MessagingPage extends StatefulWidget {
  const MessagingPage({this.initialChatId, super.key});

  final String? initialChatId;

  @override
  State<MessagingPage> createState() => _MessagingPageState();
}

class _MessagingPageState extends State<MessagingPage> {
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final messaging = AppScope.messagingOf(context);
      await messaging.connect();
      await messaging.loadChats();
      await _selectInitialChat();
    });
  }

  @override
  void didUpdateWidget(covariant MessagingPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialChatId != oldWidget.initialChatId) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _selectInitialChat());
    }
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _selectInitialChat() async {
    final chatId = widget.initialChatId;
    if (!mounted || chatId == null || chatId.isEmpty) return;

    final messaging = AppScope.messagingOf(context);
    if (messaging.activeChatId == chatId) return;
    await messaging.selectChat(chatId);
  }

  @override
  Widget build(BuildContext context) {
    final messaging = AppScope.messagingOf(context);
    return AnimatedBuilder(
      animation: messaging,
      builder: (context, _) {
        final active = messaging.activeChat;
        if (active != null) {
          return _ThreadView(chat: active, onBack: messaging.clearActiveChat);
        }

        final query = _search.text.trim().toLowerCase();
        final chats = messaging.chats
            .where(
              (chat) =>
                  query.isEmpty || chat.name.toLowerCase().contains(query),
            )
            .toList();

        return RefreshIndicator(
          onRefresh: messaging.loadChats,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Conversations',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  IconButton.filledTonal(
                    tooltip: 'New conversation',
                    onPressed: () => _showNewChatDialog(context),
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _search,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search),
                  labelText: 'Search conversations',
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 16),
              if (messaging.isLoadingChats)
                const LoadingView(label: 'Loading conversations...')
              else if (chats.isEmpty)
                const EmptyState(
                  icon: Icons.chat_bubble_outline,
                  title: 'No conversations',
                  message: 'Start a direct chat or wait for a workpoint chat.',
                )
              else
                ...chats.map((chat) => _ChatTile(chat: chat)),
            ],
          ),
        );
      },
    );
  }

  Future<void> _showNewChatDialog(BuildContext context) async {
    final messaging = AppScope.messagingOf(context);
    final users = await messaging.listUsers();
    if (!context.mounted) return;
    await showDialog<void>(
      context: context,
      builder: (context) => _NewChatDialog(users: users),
    );
  }
}

class _ChatTile extends StatelessWidget {
  const _ChatTile({required this.chat});

  final ChatListItem chat;

  @override
  Widget build(BuildContext context) {
    final last = chat.lastMessage;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(child: Text(_initials(chat.name))),
        title: Text(chat.name, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(
          last == null
              ? 'No messages yet'
              : _isAttachmentOnlyLastMessage(last)
              ? 'Attachment: ${last.attachmentName}'
              : '${last.senderUsername}: ${last.body}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: chat.unreadCount > 0
            ? Badge(
                label: Text(
                  chat.unreadCount > 99 ? '99+' : '${chat.unreadCount}',
                ),
              )
            : Text(
                formatDateTime(chat.lastMessageAt),
                style: Theme.of(context).textTheme.bodySmall,
              ),
        onTap: () => AppScope.messagingOf(context).selectChat(chat.id),
      ),
    );
  }
}

class _ThreadView extends StatefulWidget {
  const _ThreadView({required this.chat, required this.onBack});

  final ChatListItem chat;
  final VoidCallback onBack;

  @override
  State<_ThreadView> createState() => _ThreadViewState();
}

class _ThreadViewState extends State<_ThreadView> {
  final _body = TextEditingController();
  final _scroll = ScrollController();
  Timer? _typingTimer;
  Message? _replyTo;
  bool _isSendingAttachment = false;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_handleScroll);
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _body.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _handleScroll() {
    if (_scroll.position.pixels < 80) {
      AppScope.messagingOf(context).loadOlderMessages(widget.chat.id);
    }
  }

  Future<void> _send() async {
    final text = _body.text.trim();
    if (text.isEmpty) return;
    _body.clear();
    final reply = _replyTo;
    setState(() => _replyTo = null);
    await AppScope.messagingOf(
      context,
    ).sendMessage(chatId: widget.chat.id, body: text, replyToId: reply?.id);
    _stopTyping();
  }

  Future<void> _attach() async {
    final messaging = AppScope.messagingOf(context);
    final result = await FilePicker.pickFiles(withData: false);
    final file = result?.files.single;
    final path = file?.path;
    if (file == null || path == null) return;

    setState(() => _isSendingAttachment = true);
    try {
      final attachment = await messaging.uploadAttachment(
        chatId: widget.chat.id,
        path: path,
        filename: file.name,
      );
      await messaging.sendMessage(
        chatId: widget.chat.id,
        body: '',
        replyToId: _replyTo?.id,
        attachmentUrl: attachment.attachmentUrl,
        attachmentName: attachment.attachmentName,
        attachmentType: attachment.attachmentType,
      );
      setState(() => _replyTo = null);
    } catch (error) {
      if (mounted) {
        showSnack(context, errorMessage(error, 'Failed to upload attachment.'));
      }
    } finally {
      if (mounted) setState(() => _isSendingAttachment = false);
    }
  }

  void _onTyping(String value) {
    final messaging = AppScope.messagingOf(context);
    messaging.sendTyping(widget.chat.id, true);
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(milliseconds: 2500), _stopTyping);
  }

  void _stopTyping() {
    _typingTimer?.cancel();
    AppScope.messagingOf(context).sendTyping(widget.chat.id, false);
  }

  Future<void> _openAttachment(Message message) async {
    final attachmentUrl = message.attachmentUrl?.trim();
    if (attachmentUrl == null) {
      debugPrint('[attachments] abort: message has no attachmentUrl');
      return;
    }
    if (!_isMessageAttachmentUrl(attachmentUrl)) {
      debugPrint('[attachments] abort: invalid attachmentUrl=$attachmentUrl');
      showSnack(context, 'Attachment link is invalid.');
      return;
    }
    final api = AppScope.apiOf(context);
    final filename = _attachmentFilename(message);
    final shouldPreviewText = _shouldPreviewTextAttachment(message);
    final mimeType = _mimeTypeForOpen(message);
    final uti = _utiForOpen(message);
    try {
      final file = await api.downloadMessageAttachment(
        attachmentUrl: attachmentUrl,
        filename: filename,
      );
      final exists = await file.exists();
      final size = exists ? await file.length() : null;

      if (shouldPreviewText) {
        final contents = await file.readAsString(
          encoding: const Utf8Codec(allowMalformed: true),
        );
        if (!mounted) return;
        await _showTextAttachmentPreview(message, contents);
        return;
      }

      final openError = await _openFile(
        file.path,
        mimeType: mimeType,
        uti: uti,
      );
      if (openError == null) {
        debugPrint('[attachments] open complete');
        return;
      }

      if (mounted) {
        showSnack(context, openError);
      }
    } catch (error, stackTrace) {
      debugPrint('[attachments] open failed error=$error');
      debugPrint('[attachments] open failed stack=$stackTrace');
      if (mounted) {
        showSnack(context, errorMessage(error, 'Failed to open attachment.'));
      }
    }
  }

  Future<void> _showTextAttachmentPreview(
    Message message,
    String contents,
  ) async {
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          message.attachmentName ?? 'Attachment',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(child: SelectableText(contents)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final messaging = AppScope.messagingOf(context);
    final currentUserId = AppScope.authOf(context).user?.id;

    return AnimatedBuilder(
      animation: messaging,
      builder: (context, _) {
        final messages = messaging.messagesFor(widget.chat.id);
        return Column(
          children: [
            Material(
              color: Theme.of(context).colorScheme.surface,
              child: ListTile(
                leading: IconButton(
                  tooltip: 'Back',
                  onPressed: widget.onBack,
                  icon: const Icon(Icons.arrow_back),
                ),
                title: Text(widget.chat.name),
                subtitle: Text(messaging.isConnected ? 'Connected' : 'Offline'),
              ),
            ),
            Expanded(
              child: messaging.isLoadingMessages(widget.chat.id)
                  ? const LoadingView(label: 'Loading messages...')
                  : ListView.builder(
                      controller: _scroll,
                      reverse: false,
                      padding: const EdgeInsets.all(12),
                      itemCount:
                          messages.length +
                          (messaging.isTypingInActiveChat ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index >= messages.length) {
                          return const Padding(
                            padding: EdgeInsets.all(8),
                            child: Text(
                              'Typing...',
                              style: TextStyle(fontStyle: FontStyle.italic),
                            ),
                          );
                        }
                        final message = messages[index];
                        return _MessageBubble(
                          message: message,
                          isSelf: message.senderId == currentUserId,
                          onReply: () => setState(() => _replyTo = message),
                          onOpenAttachment: () => _openAttachment(message),
                        );
                      },
                    ),
            ),
            if (_replyTo != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
                color: Theme.of(context).colorScheme.secondaryContainer,
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Replying to ${_replyTo!.senderUsername}: ${_messageSummary(_replyTo!)}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      tooltip: 'Cancel reply',
                      onPressed: () => setState(() => _replyTo = null),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 8, 10),
                child: Row(
                  children: [
                    IconButton(
                      tooltip: 'Attach file',
                      onPressed: _isSendingAttachment ? null : _attach,
                      icon: _isSendingAttachment
                          ? const SizedBox.square(
                              dimension: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.attach_file),
                    ),
                    Expanded(
                      child: TextField(
                        controller: _body,
                        minLines: 1,
                        maxLines: 5,
                        decoration: const InputDecoration(
                          hintText: 'Write a message...',
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                        ),
                        onChanged: _onTyping,
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                    IconButton.filled(
                      tooltip: 'Send',
                      onPressed: _send,
                      icon: const Icon(Icons.send),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _MessageBubble extends StatefulWidget {
  const _MessageBubble({
    required this.message,
    required this.isSelf,
    required this.onReply,
    required this.onOpenAttachment,
  });

  final Message message;
  final bool isSelf;
  final VoidCallback onReply;
  final VoidCallback onOpenAttachment;

  @override
  State<_MessageBubble> createState() => _MessageBubbleState();
}

class _MessageBubbleState extends State<_MessageBubble> {
  static const _replyThreshold = 56.0;
  static const _maxDragOffset = 84.0;
  static const _flingVelocityThreshold = 650.0;

  double _dragOffset = 0;
  bool _isDragging = false;
  bool _replyArmed = false;

  void _handleDragStart(DragStartDetails details) {
    setState(() => _isDragging = true);
  }

  void _handleDragUpdate(DragUpdateDetails details) {
    final delta = details.primaryDelta ?? 0;
    final nextOffset = (_dragOffset + delta).clamp(0.0, _maxDragOffset);
    final nextArmed = nextOffset >= _replyThreshold;
    if (nextArmed && !_replyArmed) {
      HapticFeedback.selectionClick();
    }
    setState(() {
      _dragOffset = nextOffset;
      _replyArmed = nextArmed;
    });
  }

  void _handleDragEnd(DragEndDetails details) {
    final velocity = details.primaryVelocity ?? 0;
    final shouldReply =
        _dragOffset >= _replyThreshold ||
        (velocity > _flingVelocityThreshold && _dragOffset > 16);
    _resetDrag();
    if (shouldReply) widget.onReply();
  }

  void _resetDrag() {
    setState(() {
      _dragOffset = 0;
      _isDragging = false;
      _replyArmed = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final iconOpacity = (_dragOffset / _replyThreshold).clamp(0.0, 1.0);

    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.centerLeft,
      children: [
        Positioned(
          left: 18,
          child: Opacity(
            opacity: iconOpacity,
            child: CircleAvatar(
              radius: 16,
              backgroundColor: colors.primary.withValues(alpha: 0.12),
              child: Icon(Icons.reply, size: 18, color: colors.primary),
            ),
          ),
        ),
        TweenAnimationBuilder<double>(
          duration: _isDragging
              ? Duration.zero
              : const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          tween: Tween<double>(begin: 0, end: _dragOffset),
          builder: (context, offset, child) {
            return Transform.translate(offset: Offset(offset, 0), child: child);
          },
          child: GestureDetector(
            behavior: HitTestBehavior.translucent,
            onLongPress: widget.onReply,
            onHorizontalDragStart: _handleDragStart,
            onHorizontalDragUpdate: _handleDragUpdate,
            onHorizontalDragEnd: _handleDragEnd,
            onHorizontalDragCancel: _resetDrag,
            child: Align(
              alignment: widget.isSelf
                  ? Alignment.centerRight
                  : Alignment.centerLeft,
              child: _BubbleContents(
                message: widget.message,
                isSelf: widget.isSelf,
                onOpenAttachment: widget.onOpenAttachment,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _BubbleContents extends StatelessWidget {
  const _BubbleContents({
    required this.message,
    required this.isSelf,
    required this.onOpenAttachment,
  });

  final Message message;
  final bool isSelf;
  final VoidCallback onOpenAttachment;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final attachmentUrl = message.attachmentUrl;
    final attachmentName = message.attachmentName?.trim();
    final body = message.body.trim();
    final isDuplicateAttachmentName =
        attachmentUrl != null &&
        attachmentName != null &&
        body == attachmentName;
    final shouldShowBody = body.isNotEmpty && !isDuplicateAttachmentName;

    return Container(
      constraints: BoxConstraints(
        maxWidth: MediaQuery.sizeOf(context).width * 0.78,
      ),
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isSelf
            ? colors.primaryContainer
            : colors.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isSelf)
            Text(
              message.senderUsername,
              style: Theme.of(
                context,
              ).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          if (message.replyTo != null)
            Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: colors.surface.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${message.replyTo!.senderUsername}: ${_replySummary(message.replyTo!)}',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          if (shouldShowBody) SelectableText(body),
          if (attachmentUrl != null) ...[
            if (shouldShowBody) const SizedBox(height: 8),
            _AttachmentButton(
              label: message.attachmentName ?? 'Open attachment',
              onPressed: onOpenAttachment,
            ),
          ],
          const SizedBox(height: 4),
          Text(
            formatDateTime(message.createdAt),
            style: Theme.of(context).textTheme.labelSmall,
          ),
        ],
      ),
    );
  }
}

class _AttachmentButton extends StatelessWidget {
  const _AttachmentButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: colors.surface.withValues(alpha: 0.48),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colors.outlineVariant),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.insert_drive_file_outlined,
              size: 20,
              color: colors.primary,
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
      ),
    );
  }
}

class _NewChatDialog extends StatefulWidget {
  const _NewChatDialog({required this.users});

  final List<ChatUser> users;

  @override
  State<_NewChatDialog> createState() => _NewChatDialogState();
}

class _NewChatDialogState extends State<_NewChatDialog> {
  final _search = TextEditingController();
  bool _isCreating = false;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _search.text.trim().toLowerCase();
    final users = widget.users
        .where(
          (user) =>
              query.isEmpty ||
              user.username.toLowerCase().contains(query) ||
              user.email.toLowerCase().contains(query),
        )
        .toList();

    return AlertDialog(
      title: const Text('New conversation'),
      content: SizedBox(
        width: 420,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _search,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                labelText: 'Search users',
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),
            Flexible(
              child: users.isEmpty
                  ? const EmptyState(
                      icon: Icons.person_search,
                      title: 'No users found',
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      itemCount: users.length,
                      itemBuilder: (context, index) {
                        final user = users[index];
                        return ListTile(
                          leading: CircleAvatar(
                            child: Text(_initials(user.username)),
                          ),
                          title: Text(user.username),
                          subtitle: Text(user.email),
                          trailing: Chip(label: Text(user.role)),
                          enabled: !_isCreating,
                          onTap: () async {
                            setState(() => _isCreating = true);
                            try {
                              await AppScope.messagingOf(
                                context,
                              ).createDirectChat(user.id);
                              if (context.mounted) Navigator.pop(context);
                            } catch (error) {
                              if (context.mounted) {
                                showSnack(
                                  context,
                                  errorMessage(error, 'Failed to create chat.'),
                                );
                              }
                            } finally {
                              if (mounted) setState(() => _isCreating = false);
                            }
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

String _initials(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .toList();
  if (parts.isEmpty) return 'BP';
  return parts
      .map((part) => part[0])
      .join()
      .toUpperCase()
      .substring(0, parts.length == 1 ? 1 : 2);
}

String _messageSummary(Message message) {
  final body = message.body.trim();
  final attachmentName = message.attachmentName?.trim();
  if (body.isNotEmpty && body != attachmentName) return body;
  return attachmentName?.isNotEmpty == true ? attachmentName! : 'Attachment';
}

bool _isAttachmentOnlyLastMessage(LastMessage message) {
  final body = message.body.trim();
  final attachmentName = message.attachmentName?.trim();
  return attachmentName != null && (body.isEmpty || body == attachmentName);
}

String _replySummary(ReplyTo reply) {
  final body = reply.body.trim();
  return body.isEmpty ? 'Attachment' : body;
}

bool _isMessageAttachmentUrl(String url) {
  final uri = Uri.tryParse(url);
  if (uri == null) return false;
  final path = uri.hasScheme ? uri.path : url;
  return path.startsWith('/uploads/messaging/');
}

String _attachmentFilename(Message message) {
  final name = message.attachmentName?.trim();
  if (name != null && name.isNotEmpty) return name;

  final extension = _extensionForMimeType(message.attachmentType);
  return 'attachment$extension';
}

String _extensionForMimeType(String? mimeType) {
  switch (mimeType) {
    case 'application/pdf':
      return '.pdf';
    case 'application/msword':
      return '.doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '.docx';
    case 'application/vnd.ms-excel':
      return '.xls';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return '.xlsx';
    case 'application/vnd.ms-powerpoint':
      return '.ppt';
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return '.pptx';
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'text/plain':
      return '.txt';
    case 'text/csv':
      return '.csv';
    case 'application/zip':
      return '.zip';
    default:
      return '';
  }
}

String? _mimeTypeForOpen(Message message) {
  final mimeType = message.attachmentType?.trim();
  final name = message.attachmentName?.trim().toLowerCase();
  if (mimeType == 'text/markdown' || name?.endsWith('.md') == true) {
    return 'text/plain';
  }
  return mimeType?.isEmpty == true ? null : mimeType;
}

String? _utiForOpen(Message message) {
  final mimeType = message.attachmentType?.trim();
  final name = message.attachmentName?.trim().toLowerCase();
  if (mimeType == 'text/markdown' || name?.endsWith('.md') == true) {
    return 'public.plain-text';
  }
  return null;
}

bool _shouldPreviewTextAttachment(Message message) {
  final mimeType = message.attachmentType?.trim();
  final name = message.attachmentName?.trim().toLowerCase();
  return mimeType?.startsWith('text/') == true ||
      mimeType == 'application/json' ||
      name?.endsWith('.md') == true ||
      name?.endsWith('.json') == true ||
      name?.endsWith('.csv') == true ||
      name?.endsWith('.txt') == true;
}

Future<String?> _openFile(String path, {String? mimeType, String? uti}) async {
  debugPrint('[attachments] OpenFilex.open path=$path type=$mimeType uti=$uti');
  final result = await OpenFilex.open(path, type: mimeType, uti: uti);
  debugPrint(
    '[attachments] OpenFilex result type=${result.type} '
    'message=${result.message}',
  );
  if (result.type == ResultType.done) return null;

  if (mimeType != '*/*') {
    debugPrint('[attachments] OpenFilex fallback path=$path type=*/* uti=$uti');
    final fallback = await OpenFilex.open(path, type: '*/*', uti: uti);
    debugPrint(
      '[attachments] OpenFilex fallback result type=${fallback.type} '
      'message=${fallback.message}',
    );
    if (fallback.type == ResultType.done) return null;
    return _openResultMessage(fallback);
  }

  return _openResultMessage(result);
}

String _openResultMessage(OpenResult result) {
  final message = result.message.trim();
  if (message.isNotEmpty && message != 'done') return message;
  return 'No app found to open this attachment.';
}
