/**
 * UPDATE INSTRUCTIONS FOR Sidebar.jsx (or Layout.jsx)
 * ====================================================
 * 
 * Location: D:\projects\orchid-system\frontend\src\components\Sidebar.jsx
 *           or D:\projects\orchid-system\frontend\src\components\Layout.jsx
 */

// ============================================
// STEP 1: Import icons
// ============================================

// Find the lucide-react imports and ADD:
import { FileDown, FileUp } from 'lucide-react';


// ============================================
// STEP 2: Add menu items to navigation array
// ============================================

// Find the menu items array (something like menuItems, navItems, or similar)
// ADD these items in appropriate position (after Reports or at the end):

{
  name: 'Export Data',
  path: '/export',
  icon: FileDown,
  roles: ['admin', 'supervisor', 'operator'] // All roles can export
},
{
  name: 'Import Data',
  path: '/import',
  icon: FileUp,
  roles: ['admin', 'supervisor'] // Only admin/supervisor can import
},


// ============================================
// COMPLETE EXAMPLE (Menu Items Array)
// ============================================

/*
const menuItems = [
  { name: 'Dashboard', path: '/', icon: Home, roles: ['admin', 'supervisor', 'operator'] },
  { name: 'Batches', path: '/batches', icon: Layers, roles: ['admin', 'supervisor', 'operator'] },
  { name: 'Containers', path: '/containers', icon: Box, roles: ['admin', 'supervisor', 'operator'] },
  { name: 'Phase Movement', path: '/phase-transitions', icon: ArrowRightLeft, roles: ['admin', 'supervisor', 'operator'] },
  { name: 'Greenhouses', path: '/greenhouses', icon: Building2, roles: ['admin', 'supervisor'] },
  { name: 'Suppliers', path: '/suppliers', icon: Users, roles: ['admin', 'supervisor'] },
  { name: 'Varieties', path: '/varieties', icon: Flower, roles: ['admin', 'supervisor'] },
  { name: 'Reports', path: '/reports', icon: FileText, roles: ['admin', 'supervisor'] },
  
  // ADD THESE NEW ITEMS:
  { name: 'Export Data', path: '/export', icon: FileDown, roles: ['admin', 'supervisor', 'operator'] },
  { name: 'Import Data', path: '/import', icon: FileUp, roles: ['admin', 'supervisor'] },
  
  { name: 'Users', path: '/users', icon: UserCog, roles: ['admin'] },
];
*/


// ============================================
// ALTERNATIVE: If using grouped menu structure
// ============================================

/*
const menuGroups = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', path: '/', icon: Home },
      { name: 'Batches', path: '/batches', icon: Layers },
      // ... other items
    ]
  },
  {
    title: 'Data Management',  // NEW GROUP or add to existing
    items: [
      { name: 'Export Data', path: '/export', icon: FileDown },
      { name: 'Import Data', path: '/import', icon: FileUp },
    ]
  },
  // ... other groups
];
*/
