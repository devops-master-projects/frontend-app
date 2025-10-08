import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, keyframes, useTheme } from '@mui/material/styles';

const pulse = keyframes`
  0% { transform: scale(1); opacity: .5; }
  50% { transform: scale(1.05); opacity: .25; }
  100% { transform: scale(1); opacity: .5; }
`;

export default function LandingPage() {
  const theme = useTheme();

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundImage: `linear-gradient(
          to bottom,
          ${alpha('#10111D', 1)} 0%,
          ${alpha(theme.palette.primary.main, 0.35)} 100%
        )`,
      }}
    >
      {/* Overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: alpha(theme.palette.common.black, 0.5),
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          color: theme.palette.common.white,
          textAlign: 'center',
          px: { xs: 2, sm: 4 },
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            fontSize: { xs: '2.5rem', sm: '3.25rem', md: '4rem', lg: '4.5rem' },
            mb: 3,
          }}
        >
          Find and{' '}
          <Box component="span" sx={{ color: theme.palette.secondary.main }}>
            Book
          </Box>{' '}
          Your Stay
        </Typography>

        <Typography
          sx={{
            mx: 'auto',
            maxWidth: 720,
            mb: 4,
            fontSize: { xs: '1rem', md: '1.125rem' },
            color: alpha('#ffffff', 0.9),
          }}
        >
          Discover hotels, apartments and experiences tailored for you.
          Easy booking in just a few clicks.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ mt: 2 }}
        >
          <Button
            href="/auth/login"
            variant="outlined"
            color="secondary"
            size="large"
            sx={{
              borderRadius: 999,
              fontWeight: 600,
              color: theme.palette.common.white,
              borderColor: theme.palette.common.white,
              '&:hover': {
                borderColor: theme.palette.secondary.main,
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              },
            }}
          >
            Sign In
          </Button>

          <Button
            href="/auth/register"
            variant="contained"
            color="primary"
            size="large"
            sx={{
              position: 'relative',
              px: 4,
              py: 1.5,
              borderRadius: 999,
              fontWeight: 700,
              boxShadow: 4,
              overflow: 'hidden',
              '&:hover': { transform: 'translateY(-1px)' },
              transition: 'transform .2s ease',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                bgcolor: alpha(theme.palette.primary.main, 0.5),
                animation: `${pulse} 1.8s ease-in-out infinite`,
              },
              '& > span': { position: 'relative', zIndex: 1 },
            }}
          >
            <span>Sign Up</span>
          </Button>
            <Button
                href="/accommodations"
                variant="outlined"
                color="secondary"
                size="large"
                sx={{
                    borderRadius: 999,
                    fontWeight: 600,
                    color: theme.palette.common.white,
                    borderColor: theme.palette.common.white,
                    '&:hover': {
                        borderColor: theme.palette.secondary.main,
                        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    },
                }}
            >
                Skip
            </Button>

        </Stack>
      </Container>
    </Box>
  );
}
