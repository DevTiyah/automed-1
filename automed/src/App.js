import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  FaPills,
  FaCalendarAlt,
  FaBell,
  FaCog,
  FaUser,
  FaSignOutAlt,
  FaSun,
  FaMoon,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaBatteryFull,
  FaBatteryQuarter,
  FaBatteryEmpty,
  FaWifi,
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaUserShield,
  FaUserInjured,
  FaFileDownload,
  FaSignal, // Added for WiFi signal
  FaClock, // Added for timezone
  FaInfoCircle, // Added for firmware/diagnostics
  FaLink, // For device linking
  FaUnlink // For device unlinking
} from 'react-icons/fa';
import { MdEmail, MdAccessTime } from 'react-icons/md';
import { IoMdMedical } from 'react-icons/io';
import "./style.css";
import { database, ref, set, onValue, push, remove, update } from './firebase';
import { CSVLink } from 'react-csv';

const mockUsers = [
  { id: 1, name: 'John Doe', email: 'patient@example.com', password: 'patient123', role: 'patient' },
  { id: 2, name: 'Dr. Smith', email: 'caregiver@example.com', password: 'caregiver123', role: 'caregiver', managedPatientId: 'patient1' } // Caregiver manages patient1
];

const CustomModal = ({ show, message, type, onConfirm, onClose }) => {
  if (!show) return null;

  const modalClass = `custom-modal-content ${type}`;

  return (
    <div className="custom-modal-overlay">
      <div className={modalClass}>
        <p>{message}</p>
        <div className="modal-actions">
          {onConfirm && (
            <button onClick={onConfirm} className="modal-confirm-btn">
              Confirm
            </button>
          )}
          <button onClick={onClose} className="modal-close-btn">
            {onConfirm ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Nested routes for patient */}
        <Route path="/patient" element={<MainLayout role="patient" />}>
          <Route index element={<Dashboard role="patient" />} /> {/* Default child route for /patient */}
          <Route path="alerts" element={<Alerts role="patient" />} />
          <Route path="settings" element={<Settings role="patient" />} />
        </Route>
        {/* Nested routes for caregiver */}
        <Route path="/caregiver" element={<MainLayout role="caregiver" />}>
          <Route index element={<Dashboard role="caregiver" />} /> {/* Default child route for /caregiver */}
          <Route path="schedule" element={<Schedule />} />
          <Route path="patient-management" element={<PatientManagement />} />
          <Route path="alerts" element={<Alerts role="caregiver" />} />
          <Route path="settings" element={<Settings role="caregiver" />} />
        </Route>
      </Routes>
    </Router>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const user = mockUsers.find(u => u.email === email && u.password === password);

    if (user) {
      if (user.role === 'caregiver') {
        navigate('/caregiver');
      } else {
        navigate('/patient');
      }
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <IoMdMedical size={40} />
          <h1>AutoMed</h1>
          <p>Automated Medication Dispenser</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <MdEmail className="input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        <div className="login-footer">
          <p>Need help? Contact support</p>
        </div>
      </div>
    </div>
  );
};

const MainLayout = ({ role }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Get current URL location

  // Determine active tab based on the current URL path
  const getActiveTab = (pathname) => {
    if (pathname.includes('schedule')) return 'schedule';
    if (pathname.includes('patient-management')) return 'patient-management';
    if (pathname.includes('alerts')) return 'alerts';
    if (pathname.includes('settings')) return 'settings';
    return 'dashboard'; // Default to dashboard if no specific path matches
  };

  const activeTab = getActiveTab(location.pathname);

  // Function to handle navigation and close sidebar on mobile
  const handleNavigation = (path) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    navigate('/'); // Navigate to login page
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      {/* Mobile toggle button */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? "mobile-open" : ""}`}>
        {/* Close button inside sidebar */}
        <button 
          className="sidebar-close-btn"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>

        <div className="sidebar-header">
          <IoMdMedical size={28} />
          <h2>AutoMed</h2>
          <div className="user-role-badge">
            {role === 'caregiver' ? (
              <>
                <FaUserShield /> Caregiver
              </>
            ) : (
              <>
                <FaUserInjured /> Patient
              </>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigation(`/${role}`)}
          >
            <FaPills /> Dashboard
          </button>

          {role === 'caregiver' && (
            <>
              <button
                className={`nav-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                onClick={() => handleNavigation('/caregiver/schedule')}
              >
                <FaCalendarAlt /> Schedule
              </button>
              <button
                className={`nav-btn ${activeTab === 'patient-management' ? 'active' : ''}`}
                onClick={() => handleNavigation('/caregiver/patient-management')}
              >
                <FaUser /> Patient Management
              </button>
            </>
          )}

          <button
            className={`nav-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => handleNavigation(`/${role}/alerts`)}
          >
            <FaBell /> Alerts
          </button>

          <button
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavigation(`/${role}/settings`)}
          >
            <FaCog /> Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={toggleDarkMode} className="dark-mode-toggle">
            {darkMode ? <FaSun /> : <FaMoon />} {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h2>
            {activeTab === 'dashboard' && 'Medication Dashboard'}
            {activeTab === 'schedule' && 'Medication Schedule'}
            {activeTab === 'alerts' && 'Alerts & Notifications'}
            {activeTab === 'settings' && 'Device Settings'}
            {activeTab === 'patient-management' && 'Patient Management'}
          </h2>
          <div className="user-info">
            <FaUser /> {role === 'caregiver' ? 'Dr. Smith (Caregiver)' : 'John Doe (Patient)'}
          </div>
        </header>
        {/* This is where nested route content will be rendered */}
        <Outlet /> 
      </main>
    </div>
  );
};

const Dashboard = ({ role }) => {
  const [medicationStatus, setMedicationStatus] = useState('unknown');
  const [currentRTC, setCurrentRTC] = useState('Loading...');
  const [medicationSchedules, setMedicationSchedules] = useState([]);
  const [nextMedication, setNextMedication] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [medicationHistory, setMedicationHistory] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [dailyUsage, setDailyUsage] = useState({}); // NEW: State for daily usage
  const [weeklyUsage, setWeeklyUsage] = useState({}); // NEW: State for weekly usage

  useEffect(() => {
    const statusRef = ref(database, 'medication_status');
    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      const status = snapshot.val();
      if (status) {
        setMedicationStatus(status);
      }
    });

    const rtcRef = ref(database, 'rtc/time');
    const unsubscribeRTC = onValue(rtcRef, (snapshot) => {
      const rtcTime = snapshot.val();
      if (rtcTime) {
        setCurrentRTC(rtcTime);
      }
    });

    const schedulesRef = ref(database, 'medication_schedules');
    const unsubscribeSchedules = onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const schedulesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMedicationSchedules(schedulesArray);
      } else {
        setMedicationSchedules([]);
      }
    });

    const historyRef = ref(database, 'medication_history');
    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          // Ensure timestamp is stored as a Date object for calculations
          timestamp: new Date(data[key].actualTime) // Use actualTime for when it was taken
        }));
        setMedicationHistory(historyArray);
        
        // Prepare CSV data
        const csvData = historyArray.map(record => ({
          name: record.medicationName || 'Unknown',
          status: record.status || 'unknown',
          scheduledTime: record.scheduledTime || 'Not specified',
          actualTime: record.timestamp.toLocaleString(), // Use the Date object for display
          dosesTaken: record.dosesTaken || 1,
          notes: record.notes || ''
        }));
        setCsvData(csvData);

        // NEW: Calculate daily and weekly usage
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start of week
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7); // End of Sunday (next Monday 00:00)

        const currentDailyUsage = {};
        const currentWeeklyUsage = {};

        historyArray.forEach(record => {
          const recordDate = new Date(record.timestamp); // This is already a Date object from above
          const recordDateOnly = new Date(recordDate);
          recordDateOnly.setHours(0, 0, 0, 0);

          // Daily Usage
          if (recordDateOnly.getTime() === today.getTime()) {
            currentDailyUsage[record.medicationName] = (currentDailyUsage[record.medicationName] || 0) + record.dosesTaken;
          }

          // Weekly Usage
          if (recordDate >= startOfWeek && recordDate < endOfWeek) {
            currentWeeklyUsage[record.medicationName] = (currentWeeklyUsage[record.medicationName] || 0) + record.dosesTaken;
          }
        });

        setDailyUsage(currentDailyUsage);
        setWeeklyUsage(currentWeeklyUsage);

      } else {
        setMedicationHistory([]);
        setCsvData([]);
        setDailyUsage({}); // NEW: Reset daily usage
        setWeeklyUsage({}); // NEW: Reset weekly usage
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeRTC();
      unsubscribeSchedules();
      unsubscribeHistory();
    };
  }, []);

  useEffect(() => {
    if (currentRTC && currentRTC !== 'Loading...') {
      const [datePart] = currentRTC.split(' ');
      const [day, month, year] = datePart.split('/').map(Number);
      const dateObj = new Date(year, month - 1, day);
      setCurrentDate(dateObj.toLocaleDateString());
    }
  }, [currentRTC]);

  useEffect(() => {
    if (!currentRTC || currentRTC === 'Loading...' || medicationSchedules.length === 0) {
      setNextMedication(null);
      setTimeLeft('');
      return;
    }

    const [datePart, timePart] = currentRTC.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    const nowFromDevice = new Date(year, month - 1, day, hour, minute, second);

    const upcoming = medicationSchedules
      .filter(med => {
        const medDateTime = new Date(med.nextDoseTime);
        // Filter for medications that are in the future or currently 'scheduled' but not yet handled
        return medDateTime > nowFromDevice && !med.completed && med.status !== 'taken' && med.status !== 'missed';
      })
      .sort((a, b) => new Date(a.nextDoseTime).getTime() - new Date(b.nextDoseTime).getTime());

    setNextMedication(upcoming[0] || null);

    if (upcoming[0]) {
      const updateTimeLeft = () => {
        const now = new Date(); // Use local system time for UI countdown
        const nextTime = new Date(upcoming[0].nextDoseTime);
        const diff = nextTime.getTime() - now.getTime();

        if (diff <= 0) {
          // If due time has passed, reflect the actual status from Firebase
          if (medicationStatus === 'taken') {
            setTimeLeft('Taken');
          } else if (medicationStatus === 'missed') {
            setTimeLeft('Missed');
          } else if (medicationStatus === 'scheduled') {
            // This means the device is currently alerting/waiting for dispense
            setTimeLeft('Now');
          } else {
            setTimeLeft('Awaiting action'); // Default if status is unclear
          }
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours >= 24) {
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          setTimeLeft(`${days}d ${remainingHours}h ${minutes}m`);
        } else {
          setTimeLeft(`${hours}h ${minutes}m`);
        }
      };

      updateTimeLeft();
      const interval = setInterval(updateTimeLeft, 60000); // Update every minute
      return () => clearInterval(interval);
    } else {
      setTimeLeft('');
    }
  }, [medicationSchedules, currentRTC, medicationStatus]);

  // Calculates total doses left from schedules that are not completed, taken, or missed.
  // If this value is consistently zero, it implies that all active schedules
  // in Firebase have either been completed, taken, or marked as missed.
  const totalDosesLeft = medicationSchedules.reduce((total, med) => {
    if (!med.completed && med.dosesLeft && med.status !== 'taken' && med.status !== 'missed') {
      return total + med.dosesLeft;
    }
    return total;
  }, 0);

  const csvHeaders = [
    { label: "Medication Name", key: "name" },
    { label: "Status", key: "status" },
    { label: "Scheduled Time", key: "scheduledTime" },
    { label: "Actual Time", "key": "actualTime" }, // Changed to actualTime
    { label: "Doses Taken", key: "dosesTaken" },
    { label: "Notes", key: "notes" }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        <div className="dashboard-card status-card">
          <h3>Device Status</h3>
          <div className="status-items">
            <div className="status-item">
              <span>Connection:</span>
              <span className="status-value online">
                Online
                <FaWifi className="wifi-icon strong" />
              </span>
            </div>
            <div className="status-item">
              <span>Battery:</span>
              <span className="status-value">
                85%
                <FaBatteryFull className="battery-icon full" />
              </span>
            </div>
            <div className="status-item">
              <span>Medication Tray:</span>
              <span className="status-value normal">
                Adequate
              </span>
            </div>
            {currentDate && (
              <div className="status-item">
                <span>Current Date:</span>
                <span className="status-value">
                  {currentDate}
                </span>
              </div>
            )}
            {role === 'patient' && (
              <div className="status-item">
                <span>Total Doses Left:</span>
                <span className="status-value">
                  {totalDosesLeft}
                </span>
              </div>
            )}
            {nextMedication && (
              <div className="status-item">
                <span>Next Dose In:</span>
                <span className="status-value">
                  <MdAccessTime /> {timeLeft}
                </span>
              </div>
            )}
          </div>
        </div>

        {nextMedication && (
          <div className="dashboard-card next-med-card">
            <h3>{role === 'patient' ? 'Your Next Medication' : 'Next Scheduled Medication'}</h3>
            <div className="medication-info">
              <div className="med-name">{nextMedication.name}</div>
              <div className="med-details">
                {nextMedication.dosesLeft !== undefined && 
                  <span className="doses-left">
                    Doses left: {nextMedication.dosesLeft}
                  </span>
                }
              </div>
              <div className="med-time">
                <MdAccessTime /> 
                {new Date(nextMedication.nextDoseTime).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {role === 'patient' && (
                  <span className={`time-display ${medicationStatus}`}>
                    {timeLeft === 'Now' ? ' - Due Now' : ` - ${timeLeft}`}
                  </span>
                )}
              </div>
              <div className="med-instructions">{nextMedication.instructions}</div>
            </div>
          </div>
        )}
        {!nextMedication && (
          <div className="dashboard-card next-med-card">
            <h3>No Upcoming Medication</h3>
            <p>No medication is scheduled for the near future or all have been handled.</p>
          </div>
        )}

        {/* NEW: Daily Usage Card */}
        <div className="dashboard-card usage-card">
          <h3>Today's Usage</h3>
          {Object.keys(dailyUsage).length > 0 ? (
            <ul className="usage-list">
              {Object.entries(dailyUsage).map(([medName, count]) => (
                <li key={medName}>{medName}: {count} dose{count !== 1 ? 's' : ''}</li>
              ))}
            </ul>
          ) : (
            <p>No medication recorded today.</p>
          )}
        </div>

        {/* NEW: Weekly Usage Card */}
        <div className="dashboard-card usage-card">
          <h3>This Week's Usage</h3>
          {Object.keys(weeklyUsage).length > 0 ? (
            <ul className="usage-list">
              {Object.entries(weeklyUsage).map(([medName, count]) => (
                <li key={medName}>{medName}: {count} dose{count !== 1 ? 's' : ''}</li>
              ))}
            </ul>
          ) : (
            <p>No medication recorded this week.</p>
          )}
        </div>

        <div className="dashboard-card schedule-preview">
          <div className="schedule-header">
            <h3>Today's Schedule</h3>
            {role === 'caregiver' && csvData.length > 0 && (
              <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={`medication_history_${new Date().toISOString().split('T')[0]}.csv`}
                className="export-btn"
              >
                <FaFileDownload /> Export History
              </CSVLink>
            )}
          </div>
          <div className="schedule-list">
            {medicationSchedules
              .filter(med => {
                const medDate = new Date(med.nextDoseTime);
                const today = new Date();
                return medDate.toDateString() === today.toDateString();
              })
              .sort((a, b) => new Date(a.nextDoseTime) - new Date(b.nextDoseTime))
              .map(med => (
                <div key={med.id} className={`schedule-item ${med.completed ? 'completed' : ''}`}>
                  <div className="med-time">
                    {new Date(med.nextDoseTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="med-info">
                    <div className="med-name">{med.name}</div>
                    {med.dosesLeft !== undefined && (
                      <div className="med-details">
                        {med.dosesLeft} dose{med.dosesLeft !== 1 ? 's' : ''} left
                      </div>
                    )}
                  </div>
                  <div className={`med-status ${med.status || 'pending'}`}>
                    {med.completed ? (
                      <span className="completed-badge">Completed</span>
                    ) : (
                      <span className={`status-badge ${med.status || 'pending'}`}>
                        {(med.status || 'Pending').charAt(0).toUpperCase() + (med.status || 'Pending').slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
          {medicationSchedules.filter(med => {
            const medDate = new Date(med.nextDoseTime);
            const today = new Date();
            return medDate.toDateString() === today.toDateString();
          }).length === 0 && (
              <div className="no-schedule">No medications scheduled for today</div>
            )}
        </div>
      </div>
    </div>
  );
};

const Schedule = () => {
  const [medications, setMedications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedicationId, setEditingMedicationId] = useState(null);
  const [newMed, setNewMed] = useState({
    name: '',
    frequency: 'daily',
    times: ['08:00'],
    instructions: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    totalDoses: 1, // Default to 1 dose
    refillThreshold: 3 // Default refill threshold
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('');
  const [modalOnConfirm, setModalOnConfirm] = useState(null);

  const openModal = (message, type, onConfirm = null) => {
    setModalMessage(message);
    setModalType(type);
    setModalOnConfirm(() => onConfirm);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
    setModalType('');
    setModalOnConfirm(null);
  };

  useEffect(() => {
    const medsRef = ref(database, 'medication_schedules');
    const unsubscribe = onValue(medsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const medsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          times: Array.isArray(data[key].times)
            ? data[key].times
            : data[key].times
              ? [data[key].times]
              : []
        }));
        setMedications(medsArray);
      } else {
        setMedications([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const calculateNextDoseTime = (med) => {
    const now = new Date();
    const today = new Date(now.toISOString().split('T')[0]);

    if (med.times.length > 0) {
      const sortedTimes = med.times.sort();
      for (const timeStr of sortedTimes) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const nextDoseCandidate = new Date(today);
        nextDoseCandidate.setHours(hours, minutes, 0, 0);

        if (nextDoseCandidate > now) {
          return nextDoseCandidate.toISOString();
        }
      }
      // If all times for today have passed, schedule for the first time tomorrow
      const [hours, minutes] = sortedTimes[0].split(':').map(Number);
      const nextDoseTomorrow = new Date(today);
      nextDoseTomorrow.setDate(nextDoseTomorrow.getDate() + 1);
      nextDoseTomorrow.setHours(hours, minutes, 0, 0);
      return nextDoseTomorrow.toISOString();
    }

    return now.toISOString(); // Fallback
  };

  const handleSaveMedication = async () => {
    // Input validation for totalDoses
    if (newMed.totalDoses < 1 || newMed.totalDoses > 14) {
      openModal("Total Doses must be between 1 and 14.", "error");
      return;
    }
    // Input validation for refillThreshold
    if (newMed.refillThreshold < 0 || newMed.refillThreshold > newMed.totalDoses) {
        openModal("Refill Threshold cannot be negative or greater than Total Doses.", "error");
        return;
    }


    const medData = {
      name: newMed.name,
      frequency: newMed.frequency,
      times: newMed.times,
      instructions: newMed.instructions,
      startDate: newMed.startDate,
      endDate: newMed.endDate,
      totalDoses: newMed.totalDoses,
      refillThreshold: newMed.refillThreshold, // Save refill threshold
      nextDoseTime: calculateNextDoseTime(newMed),
      dosesLeft: newMed.totalDoses, // Initialize dosesLeft with totalDoses
      completed: false,
      status: 'scheduled' // Initial status
    };

    try {
      if (editingMedicationId) {
        const medRef = ref(database, `medication_schedules/${editingMedicationId}`);
        await update(medRef, medData);
        openModal("Medication updated successfully!", "success");
      } else {
        const medsRef = ref(database, 'medication_schedules');
        await push(medsRef, medData);
        openModal("Medication added successfully!", "success");
      }
      setShowAddForm(false);
      setEditingMedicationId(null);
      // Reset form fields
      setNewMed({
        name: '',
        frequency: 'daily',
        times: ['08:00'],
        instructions: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        totalDoses: 1,
        refillThreshold: 3
      });
    } catch (error) {
      console.error("Error saving medication to Firebase:", error);
      openModal("Failed to save medication. Please try again.", "error");
    }
  };

  const handleEditClick = (med) => {
    setEditingMedicationId(med.id);
    setNewMed({
      name: med.name,
      frequency: med.frequency,
      times: med.times || ['08:00'], // Ensure times is an array
      instructions: med.instructions,
      startDate: med.startDate,
      // Ensure endDate is not undefined, set to empty string if not present
      endDate: med.endDate || '', 
      totalDoses: med.totalDoses,
      refillThreshold: med.refillThreshold || 3 // Load refill threshold
    });
    setShowAddForm(true);
  };

  const handleDeleteMedication = async (id) => {
    openModal("Are you sure you want to delete this medication schedule?", "confirm", async () => {
      try {
        const medRef = ref(database, `medication_schedules/${id}`);
        await remove(medRef);
        openModal("Medication deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting medication from Firebase:", error);
        openModal("Failed to delete medication. Please try again.", "error");
      } finally {
        closeModal(); // Close modal after action
      }
    });
  };

  const handleTimeChange = (index, value) => {
    const updatedTimes = [...newMed.times];
    updatedTimes[index] = value;
    setNewMed({...newMed, times: updatedTimes});
  };

  const addTimeInput = () => {
    setNewMed({...newMed, times: [...newMed.times, '']});
  };

  const removeTimeInput = (index) => {
    const updatedTimes = newMed.times.filter((_, i) => i !== index);
    setNewMed({...newMed, times: updatedTimes});
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingMedicationId(null);
    // Reset form fields to default
    setNewMed({
      name: '',
      frequency: 'daily',
      times: ['08:00'],
      instructions: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      totalDoses: 1,
      refillThreshold: 3
    });
  };

  return (
    <div className="schedule-container">
      <CustomModal
        show={showModal}
        message={modalMessage}
        type={modalType}
        onConfirm={modalOnConfirm}
        onClose={closeModal}
      />
      <div className="schedule-header">
        <h2>Medication Schedule</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="add-med-btn">
          <FaPlus /> {showAddForm ? 'Cancel' : 'Add Medication'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-med-form">
          <h3>{editingMedicationId ? 'Edit Medication' : 'Add New Medication'}</h3>
          <div className="form-group">
            <label>Medication Name</label>
            <input
              type="text"
              value={newMed.name}
              onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
              placeholder="e.g., Ibuprofen"
              required
            />
          </div>

          <div className="form-group">
            <label>Total Doses (1-14)</label>
            <input
              type="number"
              min="1"
              max="14" // Enforce max 14 doses here
              value={newMed.totalDoses}
              onChange={(e) => setNewMed({ ...newMed, totalDoses: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <div className="form-group">
            <label>Refill Threshold (doses)</label>
            <input
              type="number"
              min="0"
              max={newMed.totalDoses} // Max refill threshold is total doses
              value={newMed.refillThreshold}
              onChange={(e) => setNewMed({ ...newMed, refillThreshold: parseInt(e.target.value) || 0 })}
              placeholder="e.g., 3"
              required
            />
          </div>

          <div className="form-group">
            <label>Frequency</label>
            <select
              value={newMed.frequency}
              onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="asNeeded">As Needed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Dosing Times</label>
            {newMed.times.map((time, index) => (
              <div key={index} className="time-input-row">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(index, e.target.value)}
                  required
                />
                {newMed.times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTimeInput(index)}
                    className="remove-time-btn"
                  >
                    <FaTimesCircle />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTimeInput}
              className="add-time-btn"
            >
              <FaPlus /> Add Another Time
            </button>
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={newMed.startDate}
              onChange={(e) => setNewMed({ ...newMed, startDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date (optional)</label>
            <input
              type="date"
              value={newMed.endDate}
              onChange={(e) => setNewMed({ ...newMed, endDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Special Instructions</label>
            <textarea
              value={newMed.instructions}
              onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
              placeholder="e.g., Take with food"
            />
          </div>

          <div className="form-actions">
            <button onClick={handleSaveMedication} className="save-btn">
              {editingMedicationId ? 'Update Medication' : 'Save Medication'}
            </button>
            <button
              onClick={handleCancelForm}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="medication-list">
        {medications.length > 0 ? (
          medications.map(med => (
            <div key={med.id} className={`medication-item ${med.completed ? 'completed' : ''}`}>
              <div className="med-info">
                <div className="med-name">{med.name}</div>
                <div className="med-details">
                  <span className="doses-left">
                    {med.dosesLeft} dose{med.dosesLeft !== 1 ? 's' : ''} left
                    {med.completed && <span className="completed-badge">Completed</span>}
                  </span>
                  <span className="frequency">{med.frequency}</span>
                  <span className="times">
                    {Array.isArray(med.times) ? med.times.join(', ') : '—'}
                  </span>
                </div>
                <div className="med-instructions">{med.instructions}</div>
                <div className="next-dose">
                  Next dose: {new Date(med.nextDoseTime).toLocaleString()}
                </div>
                {med.endDate && (
                  <div className="end-date">
                    End date: {new Date(med.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="med-actions">
                <button className="edit-btn" onClick={() => handleEditClick(med)}>
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDeleteMedication(med.id)}
                  className="delete-btn"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-medications">
            No medications scheduled. Click "Add Medication" to get started.
          </div>
        )}
      </div>
    </div>
  );
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [displayLimit, setDisplayLimit] = useState(5); // Initially show 5 alerts

  useEffect(() => {
    const alertsRef = ref(database, 'alerts');
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const alertsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAlerts(alertsArray);
      } else {
        setAlerts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    switch (activeFilter) {
      case 'unread':
        return !alert.read;
      case 'missed':
        return alert.type === 'missed';
      case 'taken':
        return alert.type === 'taken';
      case 'refill': // New filter for refill alerts
        return alert.type === 'refill';
      default:
        return true;
    }
  });

  const alertsToDisplay = displayLimit === -1 ? filteredAlerts : filteredAlerts.slice(0, displayLimit);

  const toggleDisplayLimit = () => {
    setDisplayLimit(displayLimit === -1 ? 5 : -1); // Toggle between 5 and all
  };

  const markAsRead = async (id) => {
    try {
      const alertRef = ref(database, `alerts/${id}`);
      await update(alertRef, { read: true });
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const deleteAlert = async (id) => {
    try {
      const alertRef = ref(database, `alerts/${id}`);
      await remove(alertRef);
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h2>Alerts & Notifications</h2>
        <div className="alert-filters">
          <button 
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unread')}
          >
            Unread ({alerts.filter(a => !a.read).length})
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'missed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('missed')}
          >
            Missed Doses ({alerts.filter(a => a.type === 'missed').length})
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'taken' ? 'active' : ''}`}
            onClick={() => setActiveFilter('taken')}
          >
            Taken Doses ({alerts.filter(a => a.type === 'taken').length})
          </button>
          <button // New filter button for refill alerts
            className={`filter-btn ${activeFilter === 'refill' ? 'active' : ''}`}
            onClick={() => setActiveFilter('refill')}
          >
            Refills ({alerts.filter(a => a.type === 'refill').length})
          </button>
        </div>
      </div>

      <div className="alerts-list">
        {alertsToDisplay.length > 0 ? (
          alertsToDisplay.map(alert => (
            <div
              key={alert.id}
              className={`alert-item ${alert.type} ${alert.read ? 'read' : 'unread'}`}
            >
              <div className="alert-icon">
                {alert.type === 'taken' && <FaCheckCircle />}
                {alert.type === 'missed' && <FaTimesCircle />}
                {alert.type === 'warning' && <FaExclamationTriangle />}
                {alert.type === 'refill' && <FaExclamationTriangle className="refill-icon" />} {/* Icon for refill */}
              </div>
              <div className="alert-content">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-timestamp">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
                {expandedAlert === alert.id && (
                  <div className="alert-details">
                    {/* Add more details here if needed */}
                  </div>
                )}
              </div>
              <div className="alert-actions">
                {!alert.read && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(alert.id)}
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  className="toggle-details-btn"
                  onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                >
                  {expandedAlert === alert.id ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                <button
                  className="delete-alert-btn"
                  onClick={() => deleteAlert(alert.id)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-alerts">No alerts to display.</div>
        )}
        {filteredAlerts.length > displayLimit && displayLimit !== -1 && (
            <button onClick={toggleDisplayLimit} className="see-all-btn">
                See All Alerts ({filteredAlerts.length})
            </button>
        )}
        {displayLimit === -1 && filteredAlerts.length > 5 && ( // Only show "Show Less" if showing all and there were more than 5
            <button onClick={toggleDisplayLimit} className="see-all-btn">
                Show Less
            </button>
        )}
      </div>
    </div>
  );
};

const Settings = ({ role }) => {
  const [rfidStatus, setRfidStatus] = useState('unknown');
  const [rfidUID, setRfidUID] = useState('N/A');
  const [rtcTime, setRtcTime] = useState('Loading...');
  const [deviceStatus, setDeviceStatus] = useState('unknown');
  // Mock data for new settings, these would ideally come from Firebase
  const [wifiSignalStrength, setWifiSignalStrength] = useState('Good'); // e.g., 'Excellent', 'Good', 'Fair', 'Poor'
  const [lastFirebaseSync, setLastFirebaseSync] = useState('Just now');
  const [firmwareVersion, setFirmwareVersion] = useState('v1.2.0');
  const [currentTimeZone, setCurrentTimeZone] = useState('GMT+1 (WAT)'); // Example timezone

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('');
  const [modalOnConfirm, setModalOnConfirm] = useState(null);

  const openModal = (message, type, onConfirm = null) => {
    setModalMessage(message);
    setModalType(type);
    setModalOnConfirm(() => onConfirm);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
    setModalType('');
    setModalOnConfirm(null);
  };

  useEffect(() => {
    const rfidStatusRef = ref(database, 'rfid/status');
    const rfidUIDRef = ref(database, 'rfid/uid');
    const rtcTimeRef = ref(database, 'rtc/time');
    const medicationStatusRef = ref(database, 'medication_status');
    // Add listeners for new Firebase paths if you implement them on ESP8266
    // const wifiSignalRef = ref(database, 'device_info/wifi_signal');
    // const lastSyncRef = ref(database, 'device_info/last_sync');
    // const firmwareRef = ref(database, 'device_info/firmware_version');

    const unsubscribeRfidStatus = onValue(rfidStatusRef, (snapshot) => {
      setRfidStatus(snapshot.val() || 'unknown');
    });
    const unsubscribeRfidUID = onValue(rfidUIDRef, (snapshot) => {
      setRfidUID(snapshot.val() || 'N/A');
    });
    const unsubscribeRtcTime = onValue(rtcTimeRef, (snapshot) => {
      setRtcTime(snapshot.val() || 'Loading...');
    });
    const unsubscribeMedicationStatus = onValue(medicationStatusRef, (snapshot) => {
      setDeviceStatus(snapshot.val() || 'unknown');
    });
    // Example for new listeners (uncomment and implement on ESP8266)
    // const unsubscribeWifiSignal = onValue(wifiSignalRef, (snapshot) => {
    //   setWifiSignalStrength(snapshot.val() || 'N/A');
    // });
    // const unsubscribeLastSync = onValue(lastSyncRef, (snapshot) => {
    //   setLastFirebaseSync(snapshot.val() || 'N/A');
    // });
    // const unsubscribeFirmware = onValue(firmwareRef, (snapshot) => {
    //   setFirmwareVersion(snapshot.val() || 'N/A');
    // });


    return () => {
      unsubscribeRfidStatus();
      unsubscribeRfidUID();
      unsubscribeRtcTime();
      unsubscribeMedicationStatus();
      // unsubscribeWifiSignal();
      // unsubscribeLastSync();
      // unsubscribeFirmware();
    };
  }, []);

  const handleManualDispense = async () => {
    openModal("Are you sure you want to manually dispense medication? This will trigger the device.", "confirm", async () => {
      try {
        const manualDispenseRef = ref(database, 'manual_dispense_request');
        // Set a timestamp to indicate a new request
        await set(manualDispenseRef, new Date().toISOString()); 
        openModal("Manual dispense request sent to device!", "success");
      } catch (error) {
        console.error("Error sending manual dispense request:", error);
        openModal("Failed to send manual dispense request. Please check connection.", "error");
      } finally {
        closeModal();
      }
    });
  };

  const handleRunDiagnostics = () => {
    openModal("Running device diagnostics... This may take a moment. Check device serial monitor for details.", "info");
    // In a real app, you'd send a command to ESP8266 to run diagnostics
    // e.g., set(ref(database, 'diagnostic_command'), 'run');
    setTimeout(() => {
        closeModal();
        openModal("Diagnostics complete. Check Firebase logs for results.", "success");
    }, 3000); // Simulate delay
  };

  const handleTimeZoneChange = (e) => {
    setCurrentTimeZone(e.target.value);
    openModal("Time zone updated. Device will sync shortly.", "success");
    // In a real app, send this to Firebase for ESP8266 to pick up
    // e.g., set(ref(database, 'device_settings/timezone'), e.target.value);
  };

  return (
    <div className="settings-container">
      <CustomModal
        show={showModal}
        message={modalMessage}
        type={modalType}
        onConfirm={modalOnConfirm}
        onClose={closeModal}
      />
      <h2>Device Settings & Status</h2>

      <div className="settings-section">
        <h3><FaInfoCircle /> Device Information & Health</h3>
        <div className="setting-item">
          <label>Current RTC Time:</label>
          <span>{rtcTime}</span>
        </div>
        <div className="setting-item">
          <label>Overall Device Status:</label>
          <span className={`status-badge ${deviceStatus}`}>
            {deviceStatus.charAt(0).toUpperCase() + deviceStatus.slice(1)}
          </span>
        </div>
        <div className="setting-item">
          <label>WiFi Signal:</label>
          <span className={`status-value ${wifiSignalStrength.toLowerCase()}`}>
            {wifiSignalStrength}
            <FaSignal className={`wifi-signal-icon ${wifiSignalStrength.toLowerCase()}`} />
          </span>
        </div>
        <div className="setting-item">
          <label>Last Firebase Sync:</label>
          <span>{lastFirebaseSync}</span>
        </div>
        <div className="setting-item">
          <label>Firmware Version:</label>
          <span>{firmwareVersion}</span>
        </div>
        {role === 'caregiver' && (
            <div className="setting-actions">
                <button onClick={handleRunDiagnostics} className="setting-action-btn primary">
                    Run Device Diagnostics
                </button>
            </div>
        )}
      </div>

      <div className="settings-section">
        <h3>RFID Reader Status</h3>
        <div className="setting-item">
          <label>Last Scan Status:</label>
          <span className={`status-badge ${rfidStatus}`}>
            {rfidStatus.charAt(0).toUpperCase() + rfidStatus.slice(1)}
          </span>
        </div>
        <div className="setting-item">
          <label>Last Scanned UID:</label>
          <span>{rfidUID}</span>
        </div>
      </div>

      {role === 'caregiver' && (
        <div className="settings-section">
          <h3><FaUserShield /> Caregiver Actions & Settings</h3>
          <div className="setting-item">
            <label>Time Zone:</label>
            <select value={currentTimeZone} onChange={handleTimeZoneChange}>
                <option value="GMT+1 (WAT)">GMT+1 (WAT)</option>
                <option value="GMT+0 (UTC)">GMT+0 (UTC)</option>
                <option value="GMT+2 (CAT)">GMT+2 (CAT)</option>
                {/* Add more time zones as needed */}
            </select>
          </div>
          <p className="setting-description">
            Adjusting the time zone here will update the device's internal clock for accurate scheduling.
          </p>

          <button onClick={handleManualDispense} className="setting-action-btn primary">
            <FaPills /> Manual Dispense
          </button>
          <p className="setting-description">
            This will send a signal to the device to dispense one dose immediately.
            Use with caution and ensure a compartment is available.
          </p>
        </div>
      )}

      {role === 'patient' && (
        <div className="settings-section">
          <h3><FaUserInjured /> Patient Information & Preferences</h3>
          <div className="setting-item">
            <label>Your Name:</label>
            <span>John Doe</span> {/* This would ideally be dynamic from user data */}
          </div>
          <div className="setting-item">
            <label>Notification Preferences:</label>
            {/* Example: Toggle for app notifications */}
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider round"></span>
            </label>
          </div>
          <p className="setting-description">
            Control how you receive alerts and updates from the AutoMed system.
          </p>
        </div>
      )}
    </div>
  );
};

// New PatientManagement Component
const PatientManagement = () => {
    const [patientData, setPatientData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editedPatient, setEditedPatient] = useState({ name: '', email: '' });
    const [linkedDevice, setLinkedDevice] = useState(null); // Stores linked device ID or status
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState('');
    const [modalOnConfirm, setModalOnConfirm] = useState(null);

    const openModal = (message, type, onConfirm = null) => {
        setModalMessage(message);
        setModalType(type);
        setModalOnConfirm(() => onConfirm);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalMessage('');
        setModalType('');
        setModalOnConfirm(null);
    };

    // Assume a fixed patient ID for now, or fetch from caregiver's linkedPatientId
    const patientId = 'patient1'; // Corresponds to John Doe in mockUsers

    useEffect(() => {
        const patientRef = ref(database, `patients/${patientId}`);
        const deviceRef = ref(database, `devices/device1`); // Assuming one device for now

        const unsubscribePatient = onValue(patientRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setPatientData(data);
                setEditedPatient(data); // Initialize edited state with current data
            } else {
                // If patient data doesn't exist, create a mock one for demonstration
                setPatientData({ name: 'John Doe', email: 'patient@example.com' });
                setEditedPatient({ name: 'John Doe', email: 'patient@example.com' });
                set(patientRef, { name: 'John Doe', email: 'patient@example.com' }); // Push to Firebase
            }
        });

        const unsubscribeDevice = onValue(deviceRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.linkedPatientId === patientId) {
                setLinkedDevice('device1'); // Device is linked
            } else {
                setLinkedDevice(null); // Device is not linked to this patient
            }
        });

        return () => {
            unsubscribePatient();
            unsubscribeDevice();
        };
    }, [patientId]);

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleSavePatient = async () => {
        try {
            const patientRef = ref(database, `patients/${patientId}`);
            await update(patientRef, editedPatient);
            openModal("Patient profile updated successfully!", "success");
            setEditMode(false);
        } catch (error) {
            console.error("Error updating patient profile:", error);
            openModal("Failed to update patient profile. Please try again.", "error");
        }
    };

    const handleLinkDevice = async () => {
        openModal("Are you sure you want to link a new device to this patient? This will require device ID.", "confirm", async () => {
            try {
                // In a real scenario, you'd prompt for a device ID and validate it
                // For this example, we'll link a hardcoded 'device1'
                const deviceIdToLink = 'device1';
                const deviceRef = ref(database, `devices/${deviceIdToLink}`);
                await update(deviceRef, { linkedPatientId: patientId });
                setLinkedDevice(deviceIdToLink);
                openModal(`Device ${deviceIdToLink} linked successfully!`, "success");
            } catch (error) {
                console.error("Error linking device:", error);
                openModal("Failed to link device. Please try again.", "error");
            } finally {
                closeModal();
            }
        });
    };

    const handleUnlinkDevice = async () => {
        openModal("Are you sure you want to unlink the device from this patient?", "confirm", async () => {
            try {
                const deviceRef = ref(database, `devices/${linkedDevice}`);
                await update(deviceRef, { linkedPatientId: null }); // Set to null or remove
                setLinkedDevice(null);
                openModal("Device unlinked successfully!", "success");
            } catch (error) {
                console.error("Error unlinking device:", error);
                openModal("Failed to unlink device. Please try again.", "error");
            } finally {
                closeModal();
            }
        });
    };

    if (!patientData) {
        return (
            <div className="patient-management-container">
                <p>Loading patient data...</p>
            </div>
        );
    }

    return (
        <div className="patient-management-container">
            <CustomModal
                show={showModal}
                message={modalMessage}
                type={modalType}
                onConfirm={modalOnConfirm}
                onClose={closeModal}
            />
            <h2><FaUser /> Patient Profile</h2>

            <div className="settings-section">
                <h3>Patient Details</h3>
                <div className="form-group">
                    <label>Name:</label>
                    {editMode ? (
                        <input
                            type="text"
                            value={editedPatient.name}
                            onChange={(e) => setEditedPatient({ ...editedPatient, name: e.target.value })}
                        />
                    ) : (
                        <span>{patientData.name}</span>
                    )}
                </div>
                <div className="form-group">
                    <label>Email:</label>
                    {editMode ? (
                        <input
                            type="email"
                            value={editedPatient.email}
                            onChange={(e) => setEditedPatient({ ...editedPatient, email: e.target.value })}
                        />
                    ) : (
                        <span>{patientData.email}</span>
                    )}
                </div>
                <div className="setting-actions">
                    {editMode ? (
                        <>
                            <button onClick={handleSavePatient} className="setting-action-btn primary">
                                Save Changes
                            </button>
                            <button onClick={handleEditToggle} className="setting-action-btn secondary">
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button onClick={handleEditToggle} className="setting-action-btn primary">
                            <FaEdit /> Edit Profile
                        </button>
                    )}
                </div>
            </div>

            <div className="settings-section">
                <h3><FaLink /> Linked Devices</h3>
                <div className="setting-item">
                    <label>Device Status:</label>
                    {linkedDevice ? (
                        <span className="status-badge online">Linked (ID: {linkedDevice})</span>
                    ) : (
                        <span className="status-badge offline">Not Linked</span>
                    )}
                </div>
                <div className="setting-actions">
                    {linkedDevice ? (
                        <button onClick={handleUnlinkDevice} className="setting-action-btn delete">
                            <FaUnlink /> Unlink Device
                        </button>
                    ) : (
                        <button onClick={handleLinkDevice} className="setting-action-btn primary">
                            <FaLink /> Link New Device
                        </button>
                    )}
                </div>
                <p className="setting-description">
                    Link a medication dispenser device to this patient profile. Only one device can be actively linked at a time.
                </p>
            </div>
        </div>
    );
};

export default App;