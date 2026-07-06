import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField, Box, Typography, Card, CardContent } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import VideocamIcon from '@mui/icons-material/Videocam';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    // Join a meeting
    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    };

    // Helper to generate a random 9-character meeting code (e.g., abc-defg-hij)
    const handleCreateNewMeeting = () => {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        let code = "";
        for (let i = 0; i < 9; i++) {
            if (i === 3 || i === 6) code += "-";
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        setMeetingCode(code);
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
            
            {/* Top Navigation Bar */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    px: 5, 
                    py: 2, 
                    backgroundColor: 'white', 
                    borderBottom: '1px solid #eaeaea',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.02)'
                }}
            >
                {/* Logo */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: '#0e78f9', p: 1, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <VideocamIcon sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0e78f9', letterSpacing: '0.5px' }}>
                        CONNECTO
                    </Typography>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Button 
                        onClick={() => navigate("/history")} 
                        startIcon={<RestoreIcon />} 
                        sx={{ textTransform: 'none', fontWeight: 'bold', color: 'text.secondary' }}
                    >
                        History
                    </Button>
                    <Button 
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/auth");
                        }} 
                        variant="outlined" 
                        color="error" 
                        startIcon={<LogoutIcon />} 
                        sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '20px' }}
                    >
                        Logout
                    </Button>
                </Box>
            </Box>

            {/* Main Workspace Body */}
            <Box 
                sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    px: { xs: 3, sm: 4, md: 6 }, 
                    py: { xs: 5, sm: 0 },
                    gap: { xs: 5, sm: 6, md: 10 },
                    maxWidth: 1200,
                    mx: 'auto',
                    width: '100%'
                }}
            >
                {/* Left Panel: Actions and Title */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: { xs: 'center', sm: 'flex-start' }, textAlign: { xs: 'center', sm: 'left' } }}>
                    <Typography sx={{ fontWeight: '800', lineHeight: 1.2, color: '#1a1a1a', fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem' } }}>
                        Premium video meetings.<br />
                        Now free for everyone.
                    </Typography>
                    
                    <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '18px', maxWidth: 480 }}>
                        We redesigned the service to provide high-quality, secure video calls just like quality education—accessible to all.
                    </Typography>

                    {/* Join / Create Meeting Box */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, width: '100%' }}>
                        
                        {/* New Meeting Button and Input Controls */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, width: '100%' }}>
                            <Button 
                                variant="contained" 
                                onClick={handleCreateNewMeeting}
                                startIcon={<VideocamIcon />}
                                sx={{ 
                                    bgcolor: '#0e78f9', 
                                    textTransform: 'none', 
                                    fontWeight: 'bold', 
                                    borderRadius: '8px', 
                                    px: 3, 
                                    height: '40px',
                                    whiteSpace: 'nowrap',
                                    fontSize: '15px'
                                }}
                            >
                                New Meeting
                            </Button>
                            
                            {/* Input Field with keyboard icon */}
                            <TextField 
                                value={meetingCode} 
                                onChange={e => setMeetingCode(e.target.value)} 
                                placeholder="Enter meeting code" 
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <KeyboardIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                                }}
                                sx={{ 
                                    width: '100%',
                                    maxWidth: 250, 
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        backgroundColor: 'white',
                                        height: '40px'
                                    }
                                }}
                            />

                            <Button 
                                onClick={handleJoinVideoCall} 
                                variant="text" 
                                disabled={!meetingCode.trim()}
                                sx={{ 
                                    textTransform: 'none', 
                                    fontWeight: 'bold', 
                                    fontSize: '16px',
                                    color: '#0e78f9',
                                    height: '40px'
                                }}
                            >
                                Join
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* Right Panel: Illustration */}
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box 
                        component="img" 
                        src="/logo3.png" 
                        alt="Video Call Illustration" 
                        sx={{ 
                            width: '100%', 
                            maxWidth: { xs: 300, sm: 380, md: 450 }, 
                            height: 'auto',
                            filter: 'drop-shadow(0px 8px 24px rgba(14, 120, 249, 0.08))'
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
}

export default withAuth(HomeComponent);