import mongoose from 'mongoose';
import config from './env.js';

let isConnected = false;
let listenersAdded = false;

// Augmenter la limite d'écouteurs pour éviter les avertissements
process.setMaxListeners(20);
mongoose.connection.setMaxListeners(20);

export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });

    isConnected = true;

    // Ajouter les écouteurs d'événements seulement une fois
    if (!listenersAdded) {
      // Gestion des événements de connexion
      mongoose.connection.on('error', (err) => {
        isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        isConnected = true;
      });

      mongoose.connection.on('connected', () => {
        isConnected = true;
      });

      // Gestion propre de la fermeture
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        process.exit(0);
      });

      listenersAdded = true;
    }

    return true;

  } catch (error) {
    isConnected = false;
    throw error;
  }
};

export const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
  }
};

export const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState
  };
}; 