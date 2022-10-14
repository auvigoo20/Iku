import '../styles/Login.css';

import React from 'react';
import LoginLogo from '../components/Login/LoginLogo';
import InfoContainer from '../components/Login/InfoContainer';
import SingleGradientBackground from '../components/Login/SingleGradientBackground';
import LoginForm from '../components/Login/LoginForm';

const Login = () => {

    const inputs = [
        {
            label: "Email",
            type: "text",
            name: "email",
            ariaLabel: "Email input field",
            value: ""
        },
        {
            label: "Password",
            type: "password",
            name: "password",
            ariaLabel: "Password input field",
            value: ""
        }
    ]

    return(
        <SingleGradientBackground>
            <div className='half-container left'>
                <LoginLogo />
            </div>
            <div className='half-container right'>
                <InfoContainer>
                    <h3 id='login-container-title'>Login</h3>
                    <LoginForm inputs={inputs} type={1} />
                </InfoContainer>
            </div>
        </SingleGradientBackground>
    )
}

export default Login