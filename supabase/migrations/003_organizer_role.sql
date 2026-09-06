-- Commit the enum addition before using it in subsequent migrations.
alter type public.user_role add value if not exists 'organizer';
