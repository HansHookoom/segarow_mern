import { createGlobalStyle } from 'styled-components';
import GilroyRegular from '../assets/fonts/Gilroy-Regular.woff2';

const GlobalStyles = createGlobalStyle`
  :root {
    --color-bg: #191D32;
    --color-text: #fff;
    --color-link: #fff;
    --color-link-hover: #fff;
    --color-primary: #FF8950;
    --social-bg: linear-gradient(to right, #8C654A, #36303C, #191D33);
  }
  [data-theme='light'] {
    --color-bg: #EEEEEE;
    --color-text: #191D32;
    --color-link: #191D32;
    --color-link-hover: #535353;
    --header-bg: radial-gradient(ellipse at top left, rgba(242,170,121), transparent 75%), linear-gradient(to bottom right, #EEEEEE, #EEEEEE);
    --color-primary: #FF8950;
    --social-bg: linear-gradient(to right, #bbb, #fff, #fff);
  }

  @font-face {
    font-family: 'Gilroy';
    src: url(${GilroyRegular}) format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Gilroy';
  }

  html {
    margin-top: 0 !important;
  }

  body {
    background: var(--color-bg);
    color: var(--color-text);
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background 0.3s, color 0.3s;
  }

  a {
    color: var(--color-link);
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: var(--color-link-hover);
    }
  }

  h1 {
    font-size: 1.8rem;
    margin-bottom: 10px;
    font-weight: bold;
  }

  h2 {
    font-size: 32px;
    margin-top: 25px;
    margin-bottom: 25px;
    font-weight: bold;
  }

  @media (min-width: 768px) {
    h1 {
      font-size: 2.2rem;
    }

    h2 {
      font-size: 2.5rem;
      margin-top: 35px;
      margin-bottom: 18px;
    }
  }

  [data-theme='light'] .commentContainer,
  [data-theme='light'] .comment,
  [data-theme='light'] .comment * {
    color: #191D32;
  }
  [data-theme='light'] .comment input,
  [data-theme='light'] .comment textarea {
    color: #191D32;
  }
  [data-theme='light'] .comment textarea::placeholder {
    color: #bbb;
  }
`;

export default GlobalStyles; 