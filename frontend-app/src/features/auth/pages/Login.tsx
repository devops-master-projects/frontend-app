import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Link,
  useTheme,
} from '@mui/material';
import { loginUser } from '../api/authApi';
import Navbar from "../../accommodations/navbar/Navbar.tsx";

export default function Login() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onChange =
    (key: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSubmit = form.username.trim() && form.password.trim();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    
    setSubmitting(true);
    setErrorMsg(null);
    
    try {
      const response = await loginUser({
        username: form.username.trim(),
        password: form.password,
      });

      // Store tokens in localStorage (or use a more secure method like cookies)
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('token_type', response.token_type);
      
      // Navigate to dashboard or home page
      navigate('/accommodations');
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
      <>
      <Navbar/>
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
          maxWidth: 420,
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
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600 }}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Sign in to your account to continue.
            </Typography>
          </Box>

          {errorMsg && (
            <Alert severity="error" onClose={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          )}

          <Divider sx={{ my: 1 }} />

          <TextField
            label="Username"
            value={form.username}
            onChange={onChange('username')}
            required
            fullWidth
            autoFocus
          />
          
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={onChange('password')}
            required
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!canSubmit || submitting}
            startIcon={submitting ? <CircularProgress size={18} /> : null}
            sx={{
              mt: 2,
              py: 1.25,
              fontWeight: 600,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Don't have an account?{' '}
              <Link 
                component={RouterLink} 
                to="/auth/register"
                sx={{ 
                  color: 'primary.main', 
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Create one here
              </Link>
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
      </>
  );
}