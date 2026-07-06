import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import VideocamIcon from '@mui/icons-material/Videocam';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';

const defaultTheme = createTheme({
    palette: {
        primary: {
            main: '#0e78f9', // Zoom-like Blue Color
        },
    },
});

export default function Authentication() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    let handleAuth = async () => {
        try {
            if (formState === 0) {
                await handleLogin(username, password);
            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                console.log(result);
                setUsername("");
                setName("");
                setPassword("");
                setMessage(result);
                setOpen(true);
                setError("");
                setFormState(0);
            }
        } catch (err) {
            console.log(err);
            let message = (err.response?.data?.message) || "An error occurred";
            setError(message);
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                
                {/* Left side: Zoom-like Illustration Banner */}
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage: 'url(/zoom_auth.png)',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                {/* Right side: Login / Signup Form */}
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '80%',
                        }}
                    >
                        {/* Logo and Icon */}
                        <Avatar sx={{ m: 1, bgcolor: '#0e78f9', width: 56, height: 56 }}>
                            <VideocamIcon sx={{ fontSize: 32 }} />
                        </Avatar>

                        <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', color: '#0e78f9', mt: 1 }}>
                            CONNECTO
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                            {formState === 0 ? "Welcome back! Please sign in." : "Create a new account to get started."}
                        </Typography>

                        {/* Sign In / Sign Up Toggles */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <Button 
                                variant={formState === 0 ? "contained" : "outlined"} 
                                onClick={() => { setFormState(0); setError(""); }}
                                sx={{ borderRadius: '20px', px: 4, textTransform: 'none', fontWeight: 'bold' }}
                            >
                                Sign In
                            </Button>
                            <Button 
                                variant={formState === 1 ? "contained" : "outlined"} 
                                onClick={() => { setFormState(1); setError(""); }}
                                sx={{ borderRadius: '20px', px: 4, textTransform: 'none', fontWeight: 'bold' }}
                            >
                                Sign Up
                            </Button>
                        </Box>

                        {/* Input Form Fields */}
                        <Box component="form" noValidate sx={{ mt: 1, width: '100%', maxWidth: 400 }}>
                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="name"
                                    label="Full Name"
                                    name="name"
                                    value={name}
                                    autoFocus
                                    onChange={(e) => setName(e.target.value)}
                                />
                            )}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                value={username}
                                autoFocus={formState === 0}
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            {error && (
                                <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                                    {error}
                                </Typography>
                            )}

                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                onClick={handleAuth}
                                sx={{ 
                                    mt: 4, 
                                    mb: 2, 
                                    py: 1.5, 
                                    borderRadius: '25px', 
                                    fontWeight: 'bold', 
                                    fontSize: '16px',
                                    textTransform: 'none'
                                }}
                            >
                                {formState === 0 ? "Login" : "Register"}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                message={message}
            />
        </ThemeProvider>
    );
}