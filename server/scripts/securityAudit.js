import mongoose from 'mongoose';
import config from '../config/env.js';
import User from '../models/User.js';
import Log from '../models/Log.js';
import mongoLogService from '../services/mongoLogService.js';

// Fonction pour effectuer un audit de sécurité
async function securityAudit() {
  try {
    console.log('🔒 Début de l\'audit de sécurité...');
    
    // Connexion à MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    const auditResults = {
      timestamp: new Date(),
      vulnerabilities: [],
      warnings: [],
      recommendations: []
    };
    
    // 1. Vérifier les utilisateurs avec des mots de passe faibles
    console.log('\n👥 Audit des utilisateurs...');
    const users = await User.find({}).select('email username role lastLogin isActive');
    
    // Vérifier les comptes admin
    const adminUsers = users.filter(user => user.role === 'admin');
    if (adminUsers.length === 0) {
      auditResults.vulnerabilities.push('Aucun administrateur trouvé');
    } else if (adminUsers.length > 3) {
      auditResults.warnings.push(`Trop d'administrateurs (${adminUsers.length})`);
    }
    
    // Vérifier les comptes inactifs
    const inactiveUsers = users.filter(user => !user.isActive);
    if (inactiveUsers.length > 0) {
      auditResults.warnings.push(`${inactiveUsers.length} comptes désactivés`);
    }
    
    // 2. Vérifier les tentatives de connexion échouées
    console.log('🔍 Audit des logs de sécurité...');
    const recentFailedLogins = await Log.countDocuments({
      actionType: 'login_failed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24h
    });
    
    if (recentFailedLogins > 10) {
      auditResults.vulnerabilities.push(`${recentFailedLogins} tentatives de connexion échouées en 24h`);
    }
    
    // 3. Vérifier les erreurs récentes
    const recentErrors = await Log.countDocuments({
      level: 'error',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    if (recentErrors > 5) {
      auditResults.warnings.push(`${recentErrors} erreurs en 24h`);
    }
    
    // 4. Vérifier la configuration
    console.log('⚙️ Audit de la configuration...');
    
    if (config.NODE_ENV === 'production') {
      if (config.JWT_SECRET === 'votre-secret-jwt-par-defaut-changez-le-en-production') {
        auditResults.vulnerabilities.push('JWT_SECRET par défaut en production');
      }
      
      if (!config.EMAIL_USER || !config.EMAIL_PASS) {
        auditResults.warnings.push('Configuration email manquante');
      }
    }
    
    // 5. Vérifier les sessions expirées
    const expiredSessions = await Log.countDocuments({
      actionType: 'session_expired',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    if (expiredSessions > 0) {
      auditResults.warnings.push(`${expiredSessions} sessions expirées en 24h`);
    }
    
    // 6. Générer des recommandations
    if (auditResults.vulnerabilities.length === 0) {
      auditResults.recommendations.push('Aucune vulnérabilité critique détectée');
    } else {
      auditResults.recommendations.push('Corriger les vulnérabilités identifiées');
    }
    
    if (adminUsers.length < 2) {
      auditResults.recommendations.push('Créer un compte administrateur de secours');
    }
    
    auditResults.recommendations.push('Vérifier régulièrement les logs de sécurité');
    auditResults.recommendations.push('Mettre à jour les dépendances régulièrement');
    
    // Afficher les résultats
    console.log('\n📊 Résultats de l\'audit de sécurité:');
    console.log('=====================================');
    
    if (auditResults.vulnerabilities.length > 0) {
      console.log('\n🚨 VULNÉRABILITÉS:');
      auditResults.vulnerabilities.forEach(vuln => console.log(`  - ${vuln}`));
    }
    
    if (auditResults.warnings.length > 0) {
      console.log('\n⚠️ AVERTISSEMENTS:');
      auditResults.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log('\n💡 RECOMMANDATIONS:');
    auditResults.recommendations.forEach(rec => console.log(`  - ${rec}`));
    
    // Logger l'audit
    await mongoLogService.info('Audit de sécurité effectué', {
      vulnerabilities: auditResults.vulnerabilities.length,
      warnings: auditResults.warnings.length,
      recommendations: auditResults.recommendations.length,
      totalUsers: users.length,
      adminUsers: adminUsers.length,
      inactiveUsers: inactiveUsers.length,
      recentFailedLogins,
      recentErrors
    });
    
    console.log('\n✅ Audit de sécurité terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'audit de sécurité:', error);
    
    await mongoLogService.error('Erreur audit de sécurité', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter l'audit si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  securityAudit();
}

export default securityAudit; 