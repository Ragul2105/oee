
import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
    const [machines, setMachines] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('https://oee-zfyq.onrender.com/machines')
            .then(response => setMachines(response.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <Container sx={{ marginTop: 2, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h4" gutterBottom>
                Machine Dashboard
            </Typography>
            <Grid container spacing={3} justifyContent="center">
                {machines.map(machine => (
                    <Grid item xs={12} sm={6} md={4} key={machine._id}>
                        <Card
                            onClick={() => navigate(`/dataentry/${machine.name}`)}
                            sx={{
                                cursor: 'pointer',
                                backgroundColor: '#f5f5f5',
                                '&:hover': { backgroundColor: '#e0e0e0' },
                                textAlign: 'center',
                            }}
                        >
                            <CardContent>
                                <Typography variant="h5">{machine.name}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default Home;
