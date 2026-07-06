import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Box, Typography, Avatar } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close';
import server from '../environment';


const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(true);

    let [audio, setAudio] = useState(true);

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        console.log("HELLO")
        getPermissions();
    }, [])

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };


    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);
        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href, username)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients, serverUsernames) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream, username: serverUsernames[socketListId] || "Guest" } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true,
                                username: serverUsernames[socketListId] || "Guest"
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        const newVideoState = !video;
        setVideo(newVideoState);
        if (window.localStream) {
            window.localStream.getVideoTracks().forEach((track) => {
                track.enabled = newVideoState;
            });
        }
    }
    let handleAudio = () => {
        const newAudioState = !audio;
        setAudio(newAudioState);
        if (window.localStream) {
            window.localStream.getAudioTracks().forEach((track) => {
                track.enabled = newAudioState;
            });
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            if (screen === true) {
                getDislayMedia();
            } else {
                try {
                    let tracks = localVideoref.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                } catch (e) { console.log(e); }
                getUserMedia();
            }
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }


    return (
        <div>

            {askForUsername === true ?
                <Box 
                    sx={{ 
                        minHeight: '100vh', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        backgroundColor: '#ffffff',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Background Ambient Blobs for Premium Aesthetic */}
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            top: '-10%', 
                            right: '-10%', 
                            width: '450px', 
                            height: '450px', 
                            borderRadius: '50%', 
                            backgroundColor: 'rgba(14, 120, 249, 0.08)', 
                            filter: 'blur(120px)', 
                            zIndex: 0,
                            pointerEvents: 'none'
                        }}
                    />
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            bottom: '-15%', 
                            left: '-10%', 
                            width: '500px', 
                            height: '500px', 
                            borderRadius: '50%', 
                            backgroundColor: 'rgba(234, 67, 53, 0.05)', 
                            filter: 'blur(120px)', 
                            zIndex: 0,
                            pointerEvents: 'none'
                        }}
                    />

                    {/* Top Navigation Bar */}
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            px: 5, 
                            py: 2.5, 
                            backgroundColor: 'white', 
                            borderBottom: '1px solid #eaeaea',
                            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.02)',
                            zIndex: 1
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ bgcolor: '#0e78f9', p: 1, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <VideocamIcon sx={{ color: 'white', fontSize: 24 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0e78f9', letterSpacing: '0.5px' }}>
                                CONNECTO
                            </Typography>
                        </Box>
                    </Box>

                    {/* Main Container */}
                    <Box 
                        sx={{ 
                            flex: 1,
                            display: 'flex', 
                            flexDirection: { xs: 'column', md: 'row' }, 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: 8,
                            width: '100%',
                            maxWidth: 1100,
                            mx: 'auto',
                            px: 6,
                            py: 4,
                            zIndex: 1
                        }}
                    >
                        {/* Left Column: Video Preview with controls */}
                        <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box 
                                sx={{ 
                                    position: 'relative', 
                                    width: '100%', 
                                    maxWidth: 580, 
                                    aspectRatio: '16/9', 
                                    borderRadius: '20px', 
                                    overflow: 'hidden', 
                                    backgroundColor: '#202124',
                                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {/* Self Video Feed */}
                                <video 
                                    ref={(ref) => {
                                        localVideoref.current = ref;
                                        if (ref && window.localStream) {
                                            ref.srcObject = window.localStream;
                                        }
                                    }}
                                    autoPlay 
                                    muted 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover',
                                        transform: 'scaleX(-1)', // Mirror effect
                                        display: video ? 'block' : 'none'
                                    }}
                                />

                                {/* Placeholder when Camera is Off */}
                                {!video && (
                                    <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ width: 80, height: 80, bgcolor: '#5f6368', fontSize: 32 }}>
                                            {username ? username.charAt(0).toUpperCase() : '?'}
                                        </Avatar>
                                        <Typography variant="body1" sx={{ fontWeight: '500' }}>Camera is off</Typography>
                                    </Box>
                                )}

                                {/* Overlay Buttons for Mic and Camera */}
                                <Box 
                                    sx={{ 
                                        position: 'absolute', 
                                        bottom: 20, 
                                        display: 'flex', 
                                        gap: 2.5, 
                                        zIndex: 10 
                                    }}
                                >
                                    {/* Mic Toggle Icon */}
                                    <IconButton 
                                        onClick={handleAudio} 
                                        sx={{ 
                                            bgcolor: audio ? 'rgba(255, 255, 255, 0.2)' : '#ea4335',
                                            color: 'white',
                                            backdropFilter: 'blur(8px)',
                                            '&:hover': {
                                                bgcolor: audio ? 'rgba(255, 255, 255, 0.3)' : '#d93025'
                                            },
                                            p: 1.8,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        {audio ? <MicIcon sx={{ fontSize: 22 }} /> : <MicOffIcon sx={{ fontSize: 22 }} />}
                                    </IconButton>

                                    {/* Camera Toggle Icon */}
                                    <IconButton 
                                        onClick={handleVideo} 
                                        sx={{ 
                                            bgcolor: video ? 'rgba(255, 255, 255, 0.2)' : '#ea4335',
                                            color: 'white',
                                            backdropFilter: 'blur(8px)',
                                            '&:hover': {
                                                bgcolor: video ? 'rgba(255, 255, 255, 0.3)' : '#d93025'
                                            },
                                            p: 1.8,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        {video ? <VideocamIcon sx={{ fontSize: 22 }} /> : <VideocamOffIcon sx={{ fontSize: 22 }} />}
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>

                        {/* Right Column: Name input and Join Form (Enclosed in card) */}
                        <Box sx={{ flex: 0.8, display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Box 
                                sx={{ 
                                    width: '100%', 
                                    maxWidth: 380, 
                                    backgroundColor: 'white', 
                                    p: 4.5, 
                                    borderRadius: '24px', 
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
                                    border: '1px solid #f1f2f4',
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: 3 
                                }}
                            >
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a1a1a', mb: 1, letterSpacing: '-0.5px' }}>
                                        Ready to join?
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                        Meeting code: {window.location.pathname.split("/").pop()}
                                    </Typography>
                                </Box>

                                <TextField 
                                    label="Your name" 
                                    value={username} 
                                    onChange={e => setUsername(e.target.value)} 
                                    variant="outlined" 
                                    fullWidth
                                    autoFocus
                                    InputProps={{
                                        sx: { borderRadius: '10px', backgroundColor: 'white' }
                                    }}
                                />

                                <Button 
                                    variant="contained" 
                                    onClick={connect}
                                    disabled={!username.trim()}
                                    sx={{ 
                                        bgcolor: '#0e78f9', 
                                        color: 'white', 
                                        textTransform: 'none', 
                                        fontWeight: 'bold', 
                                        py: 1.8,
                                        borderRadius: '25px',
                                        fontSize: '16px',
                                        boxShadow: '0 4px 12px rgba(14, 120, 249, 0.2)',
                                        '&:hover': { bgcolor: '#0b5cff', boxShadow: '0 6px 16px rgba(14, 120, 249, 0.3)' }
                                    }}
                                >
                                    Join now
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box> :


                <div className={styles.meetVideoContainer}>

                    {showModal ? <div className={styles.chatRoom}>

                        <div className={styles.chatContainer}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
                                <h1>Chat</h1>
                                <IconButton onClick={closeChat}>
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            <div className={styles.chattingDisplay}>

                                {messages.length !== 0 ? messages.map((item, index) => {

                                    console.log(messages)
                                    return (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )
                                }) : <p>No Messages Yet</p>}


                            </div>

                            <div className={styles.chattingArea}>
                                <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
                                <Button variant='contained' onClick={sendMessage}>Send</Button>
                            </div>


                        </div>
                    </div> : <></>}


                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon  />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton> : <></>}

                        <Badge badgeContent={newMessages} max={999} color='orange'>
                            <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                <ChatIcon />                        </IconButton>
                        </Badge>

                    </div>


                    {/* Local User Video with Username Overlay */}
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            bottom: '10vh', 
                            left: '20px', 
                            height: '20vh', 
                            aspectRatio: '16/9',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#202124'
                        }}
                    >
                        <video 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                            ref={(ref) => {
                                localVideoref.current = ref;
                                if (ref && window.localStream) {
                                    ref.srcObject = window.localStream;
                                }
                            }} 
                            autoPlay 
                            muted
                        />
                        <Box 
                            sx={{ 
                                position: 'absolute', 
                                bottom: 8, 
                                left: 8, 
                                bgcolor: 'rgba(0,0,0,0.5)', 
                                color: 'white', 
                                px: 1, 
                                py: 0.5, 
                                borderRadius: '4px', 
                                fontSize: '11px', 
                                fontWeight: '500',
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            {username} (You)
                        </Box>
                    </Box>

                    {/* Remote Participant Streams Grid */}
                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <Box 
                                key={video.socketId} 
                                sx={{ 
                                    position: 'relative', 
                                    width: '100%', 
                                    maxWidth: '320px', 
                                    aspectRatio: '16/9',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    backgroundColor: '#202124',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                                }}
                            >
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <Box 
                                    sx={{ 
                                        position: 'absolute', 
                                        bottom: 8, 
                                        left: 8, 
                                        bgcolor: 'rgba(0,0,0,0.5)', 
                                        color: 'white', 
                                        px: 1, 
                                        py: 0.5, 
                                        borderRadius: '4px', 
                                        fontSize: '11px', 
                                        fontWeight: '500',
                                        backdropFilter: 'blur(4px)'
                                    }}
                                >
                                    {video.username || "Guest"}
                                </Box>
                            </Box>
                        ))}
                    </div>

                </div>

            }

        </div>
    )
}
