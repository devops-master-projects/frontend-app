import { useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  TextField,
  Button,
  Typography,
  Alert,
  MenuItem,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material';
import { registerUser } from '../api/authApi';

export default function Register() {
  const theme = useTheme();

  const [form, setForm] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    role: 'guest',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onChange =
    (key: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSubmit =
    form.username.trim() &&
    form.password.trim() &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.role.trim();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const msg = await registerUser({
        username: form.username.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        address: form.address.trim() || undefined,
        role: form.role.trim(),
      });
      setSuccessMsg(msg || 'User registered successfully!');
      setForm((f) => ({
        ...f,
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: '',
        address: '',
      }));
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
        component="form"
        onSubmit={onSubmit}
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 480,
          p: { xs: 3, md: 4 },
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
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600 }}>
              Create your account
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Fill in your details to get started.
            </Typography>
          </Box>

          {successMsg && (
            <Alert severity="success" onClose={() => setSuccessMsg(null)}>
              {successMsg}
            </Alert>
          )}
          {errorMsg && (
            <Alert severity="error" onClose={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          )}

          <Divider sx={{ my: 1 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="First name"
              value={form.firstName}
              onChange={onChange('firstName')}
              required
            />
            <TextField
              fullWidth
              label="Last name"
              value={form.lastName}
              onChange={onChange('lastName')}
              required
            />
          </Stack>

          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={onChange('email')}
            required
            fullWidth
          />
          <TextField
            label="Username"
            value={form.username}
            onChange={onChange('username')}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={onChange('password')}
            required
            fullWidth
          />
          <TextField
            label="Address (optional)"
            value={form.address}
            onChange={onChange('address')}
            placeholder="City, Street…"
            fullWidth
          />

          <TextField
            select
            label="Role"
            value={form.role}
            onChange={onChange('role')}
            required
            helperText="Default is 'guest'"
            fullWidth
          >
            <MenuItem value="guest">guest</MenuItem>
            <MenuItem value="host">host</MenuItem>
          </TextField>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!canSubmit || submitting}
            startIcon={submitting ? <CircularProgress size={18} /> : null}
            sx={{
              mt: 1,
              py: 1.25,
              fontWeight: 600,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            {submitting ? 'Registering…' : 'Create account'}
          </Button>

          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            By registering you agree to our Terms & Privacy Policy.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
