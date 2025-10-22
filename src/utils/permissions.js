/**
 * Utilitaires de gestion des permissions
 */

import { PermissionFlagsBits } from 'discord.js';
import { getConfig } from '../services/dataService.js';

/**
 * Vérifie si un membre a les permissions admin
 * Basé sur le rôle admin configuré ou sur la permission ManageGuild
 */
export async function isAdmin(member) {
  try {
    // Vérifier la permission ManageGuild
    if (member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return true;
    }
    
    // Vérifier le rôle admin configuré
    const config = await getConfig();
    if (config.adminRoleId && member.roles.cache.has(config.adminRoleId)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions admin:', error);
    return member.permissions.has(PermissionFlagsBits.ManageGuild);
  }
}

/**
 * Vérifie si un membre est staff (a accès aux tickets)
 */
export async function isStaff(member, staffRoles = []) {
  try {
    // Admin = staff automatiquement
    if (await isAdmin(member)) {
      return true;
    }
    
    // Vérifier les rôles staff
    for (const roleId of staffRoles) {
      if (member.roles.cache.has(roleId)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions staff:', error);
    return false;
  }
}

/**
 * Vérifie si un membre peut modérer (kick/ban/mute)
 */
export function canModerate(member) {
  return (
    member.permissions.has(PermissionFlagsBits.KickMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers)
  );
}

export default {
  isAdmin,
  isStaff,
  canModerate
};
