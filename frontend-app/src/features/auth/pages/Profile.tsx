import React, { useEffect, useState} from 'react';
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  useTheme, Popover,
} from '@mui/material';
import type {ReactElement} from "react";
import {
  getProfile,
  updateProfile,
  changeCredentials,
  type UpdateProfileRequest,
  type ChangeCredentialsRequest, deleteAccount, getRole,
} from '../api/authApi';
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HostNavbar from "../../accommodations/navbar/HostNavbar.tsx";
import GuestNavbar from "../../accommodations/navbar/GuestNavbar.tsx";

export default function Profile() {
  const theme = useTheme();
  const role : string = getRole();

  const [tab, setTab] = useState<'profile' | 'credentials'>('profile');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [deleteAnchorEl, setDeleteAnchorEl] = useState<HTMLElement | null>(null);
  const openDeletePopover = Boolean(deleteAnchorEl);

  const handleOpenDelete = (event: React.MouseEvent<HTMLElement>) => {
    setDeleteAnchorEl(event.currentTarget);
  };

  const handleCloseDelete = () => {
    setDeleteAnchorEl(null);
  };

  const [profile, setProfile] = useState<UpdateProfileRequest>({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
  });

  const [creds, setCreds] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProfile();
        console.log("data: " + data.firstName)
        if (!cancelled) {
          setProfile((p) => ({
            ...p,
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
            email: data.email ?? '',
            address: data.address ?? '',
          }));
        }
      } catch {
        // ignore if endpoint not implemented or returns 401/404
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDeleteAccount = async () => {
    try {
      setDeleteError(null);
      setDeleting(true);
      await deleteAccount();
      localStorage.clear();

      // @ts-ignore
      if (typeof window !== "undefined" && !window.__vitest__) {
        window.location.href = "/";
      }
    } catch (error: unknown) {
      let message = "An unexpected error occurred.";

      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed.error) {
            const match = parsed.error.match(/"(.*?)"$/);
            message = match ? match[1] : parsed.error;
          }
        } catch {
          message = error.message;
        }
      }
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  };



  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setAlert(null);
    try {
      const msg = await updateProfile(profile);
      setAlert({ type: 'success', msg: msg || 'Profile updated successfully!' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setAlert({ type: 'error', msg: message || 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  }

  function validateCreds() {
    if (!creds.currentPassword.trim()) return 'Current password is required';
    if (!creds.newPassword.trim()) return 'New password is required';
    if (creds.newPassword.length < 8) return 'New password must be at least 8 characters';
    if (creds.newPassword !== creds.confirmNewPassword) return 'Password confirmation does not match';
    return null;
  }

  async function onSaveCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const err = validateCreds();
    if (err) {
      setAlert({ type: 'error', msg: err });
      return;
    }

    setSaving(true);
    setAlert(null);

    const payload: ChangeCredentialsRequest = {
      currentPassword: creds.currentPassword,
      newPassword: creds.newPassword,
    };

    try {
      const msg = await changeCredentials(payload);
      setAlert({ type: 'success', msg: msg || 'Credentials updated successfully!' });
      setCreds({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setAlert({ type: 'error', msg: message || 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  }

  return (
      <>
        {role === "HOST" && <HostNavbar /> as ReactElement}
        {role === "GUEST" && <GuestNavbar /> as ReactElement}
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: { xs: 4, md: 8 },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 720,
          p: { xs: 2.5, md: 4 },
          borderRadius: theme.shape.borderRadius,
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 6,
            bgcolor: 'primary.main',
          },
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>Account settings</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your profile and sign-in credentials.
            </Typography>
          </Box>

          {alert && (
            <Alert severity={alert.type} onClose={() => setAlert(null)}>
              {alert.msg}
            </Alert>
          )}

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab value="profile" label="Profile" />
            <Tab value="credentials" label="Credentials" />
          </Tabs>

          <Divider />

          {tab === 'profile' ? (
            <Box component="form" onSubmit={onSaveProfile}>
              <Stack spacing={2.25}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="First name"
                    value={profile.firstName}
                    onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Last name"
                    value={profile.lastName}
                    onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                    required
                    fullWidth
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Address"
                    value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                    fullWidth
                  />
                </Stack>

                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} /> : null}
                    sx={{
                      mt: 1,
                      py: 1.25,
                      fontWeight: 600,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: theme.palette.primary.dark },
                    }}
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button
                      variant="contained"
                      disabled={deleting}
                      color="error"
                      startIcon={deleting ? <CircularProgress size={18} /> : null}
                      onClick={handleOpenDelete}
                      sx={{
                        mt: 1,
                        ml: 2,
                        py: 1.25,
                        fontWeight: 600,
                        color: "primary.contrastText",
                        bgcolor: theme.palette.error.main,
                        "&:hover": { bgcolor: theme.palette.error.dark },
                      }}
                  >
                    {deleting ? "Deleting…" : "Delete account"}
                  </Button>


                </Box>
              </Stack>
            </Box>
          ) : (
            <Box component="form" onSubmit={onSaveCredentials}>
              <Stack spacing={2.25}>
                <TextField
                  label="Current password"
                  type="password"
                  required
                  value={creds.currentPassword}
                  onChange={(e) => setCreds((c) => ({ ...c, currentPassword: e.target.value }))}
                  fullWidth
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="New password"
                    type="password"
                    value={creds.newPassword}
                    onChange={(e) => setCreds((c) => ({ ...c, newPassword: e.target.value }))}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Confirm new password"
                    type="password"
                    value={creds.confirmNewPassword}
                    onChange={(e) => setCreds((c) => ({ ...c, confirmNewPassword: e.target.value }))}
                    required
                    fullWidth
                  />
                </Stack>

                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} /> : null}
                    sx={{
                      mt: 1,
                      py: 1.25,
                      fontWeight: 600,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: theme.palette.primary.dark },
                    }}
                  >
                    {saving ? 'Saving…' : 'Update credentials'}
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}
        </Stack>
        <Popover
            open={openDeletePopover}
            disablePortal={process.env.NODE_ENV === 'test'}
            anchorEl={deleteAnchorEl}
            keepMounted={false}
            transitionDuration={0}
            onClose={handleCloseDelete}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Box sx={{ p: 2, maxWidth: 260 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <WarningAmberIcon color="error" />
              <Typography variant="subtitle1" fontWeight={600}>
                Delete Account
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" mb={2}>
              Are you sure you want to permanently delete your account? This action cannot be undone.
            </Typography>

            {deleteError && (
                <Typography variant="body2" color="error" sx={{ mt: 1, mb: 1 }}>
                  {deleteError}
                </Typography>
            )}

            <Box display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={handleCloseDelete}>
                Cancel
              </Button>
              <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </Box>
          </Box>
        </Popover>
      </Paper>
    </Box>
        </>
  );
}
