import { Router } from 'express';
import authRoutes from './authRoutes.js';
import onboardingRoutes from './onboardingRoutes.js';
import studentRoutes from './studentRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import hifzRoutes from './hifzRoutes.js';
import kitabRoutes from './kitabRoutes.js';
import examRoutes from './examRoutes.js';
import financeRoutes from './financeRoutes.js';
import hostelRoutes from './hostelRoutes.js';
import admissionRoutes from './admissionRoutes.js';
import libraryRoutes from './libraryRoutes.js';
import certificateRoutes from './certificateRoutes.js';
import aiAgentRoutes from './aiAgentRoutes.js';
import automationRoutes from './automationRoutes.js';
import publicRoutes from './publicRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/hifz', hifzRoutes);
router.use('/kitab', kitabRoutes);
router.use('/exams', examRoutes);
router.use('/finance', financeRoutes);
router.use('/hostel', hostelRoutes);
router.use('/admissions', admissionRoutes);
router.use('/library', libraryRoutes);
router.use('/certificates', certificateRoutes);
router.use('/ai', aiAgentRoutes);
router.use('/automations', automationRoutes);
router.use('/public', publicRoutes);

export default router;
