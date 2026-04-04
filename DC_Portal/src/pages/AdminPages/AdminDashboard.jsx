import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  StatusBar,
  Image,
  RefreshControl,
  Animated,
} from 'react-native';
import { API_URL } from '../../utils/env'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Share from 'react-native-share';

const FILTER_OPTIONS = [
  { key: 'none', label: 'No Filter' },
  { key: 'status', label: 'Status' },
  { key: 'student_id', label: 'Student ID' },
  { key: 'student_name', label: 'Student Name' },
  { key: 'faculty_id', label: 'Faculty ID' },
  { key: 'faculty_name', label: 'Faculty Name' },
  { key: 'meeting_alloted', label: 'Meeting Alloted' },
  { key: 'date_range', label: 'Date Range' },
  { key: 'time_range', label: 'Time Range' },
  { key: 'date_time_range', label: 'Date-Time Range' },
];

const DEFAULT_EXPORT_FILTER = {
  type: 'none',
  value: '',
  from: '',
  to: '',
};

const AdminDashboard = () => {
  const navigation = useNavigation();
  const [allStudentsCounts, setAllStudentsCounts] = useState(null);
  const [specificStudentData, setSpecificStudentData] = useState(null);
  
  // ✅ NEW: Faculty states
  const [allFacultyCounts, setAllFacultyCounts] = useState(null);
  const [specificFacultyData, setSpecificFacultyData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // ✅ NEW:  Faculty search loading
  const [facultySearchLoading, setFacultySearchLoading] = useState(false);
  
  const [adminId, setAdminId] = useState('');
  const [adminName, setAdminName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Student dropdown states
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  // ✅ NEW: Faculty dropdown states
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyModalVisible, setFacultyModalVisible] = useState(false);
  const [facultyLoading, setFacultyLoading] = useState(false);
  
  // Search states for modals
  const [searchText, setSearchText] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // ✅ NEW:  Faculty search states
  const [facultySearchText, setFacultySearchText] = useState('');
  const [filteredFaculty, setFilteredFaculty] = useState([]);

  const statusOptions = ['all', 'accepted', 'rejected', 'resolved', 'pending'];
  const meetingAllotedOptions = ['all', 'yes', 'no'];
  const [complaintExportFilter, setComplaintExportFilter] = useState(DEFAULT_EXPORT_FILTER);
  const [meetingExportFilter, setMeetingExportFilter] = useState(DEFAULT_EXPORT_FILTER);
  const [complaintsExportLoading, setComplaintsExportLoading] = useState(false);
  const [meetingsExportLoading, setMeetingsExportLoading] = useState(false);
  const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);
  const [filterDropdownTarget, setFilterDropdownTarget] = useState('complaints');

  // Animation value
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedId = await AsyncStorage.getItem('user_id');
        const storedName = await AsyncStorage. getItem('user_name');
        if (storedId) {
          setAdminId(storedId);
          setAdminName(storedName || 'Admin');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Failed to fetch user ID:', error);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    fetchAllStudentsCounts();
    fetchStudentsList();
    // ✅ NEW:  Fetch faculty data
    fetchAllFacultyCounts();
    fetchFacultyList();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (adminId) {
        fetchAllStudentsCounts();
        fetchStudentsList();
        // ✅ NEW: Refresh faculty data
        fetchAllFacultyCounts();
        fetchFacultyList();
      }
    }, [adminId])
  );

  // Student search filter
  useEffect(() => {
    if (! searchText. trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchText.toLowerCase()) ||
        student.reg_num.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchText, students]);

  // ✅ NEW: Faculty search filter
  useEffect(() => {
    if (!facultySearchText. trim()) {
      setFilteredFaculty(faculty);
    } else {
      const filtered = faculty.filter(f => 
        f.name. toLowerCase().includes(facultySearchText.toLowerCase())
      );
      setFilteredFaculty(filtered);
    }
  }, [facultySearchText, faculty]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAllStudentsCounts(), 
      fetchStudentsList(),
      fetchAllFacultyCounts(),
      fetchFacultyList()
    ]);
    setRefreshing(false);
  };

  // ==================== STUDENT FUNCTIONS ====================
  
  const fetchAllStudentsCounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/getAllStudentsCounts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setAllStudentsCounts(data);
      } else {
        Alert.alert('Error', 'Failed to fetch student counts');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsList = async () => {
    setStudentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/getStudents`);
      const data = await response.json();

      if (data.success) {
        setStudents(data.data);
        setFilteredStudents(data. data);
      } else {
        Alert.alert('Error', 'Failed to fetch students list');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Network error while fetching students.');
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchSpecificStudent = async () => {
    if (!selectedStudent) {
      Alert.alert('Error', 'Please select a student');
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/getStudentProfile/${selectedStudent. user_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      const data = await response.json();

      if (data.success) {
        setSpecificStudentData(data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch student profile');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const resetSpecificSearch = () => {
    setSelectedStudent(null);
    setSpecificStudentData(null);
  };

  const openModal = () => {
    setSearchText('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setSearchText('');
    setModalVisible(false);
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    closeModal();
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver:  true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver:  true,
      }),
    ]).start();
  };

  const clearSearch = () => {
    setSearchText('');
  };

  // ==================== FACULTY FUNCTIONS ====================
  
  const fetchAllFacultyCounts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/getAllFacultyCounts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setAllFacultyCounts(data);
      }
    } catch (error) {
      console.error('Error fetching faculty counts:', error);
    }
  };

  const fetchFacultyList = async () => {
    setFacultyLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/getfaculty`);
      const data = await response.json();

      if (data.success) {
        setFaculty(data.data);
        setFilteredFaculty(data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch faculty list');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Network error while fetching faculty.');
    } finally {
      setFacultyLoading(false);
    }
  };

  const fetchSpecificFaculty = async () => {
    if (!selectedFaculty) {
      Alert.alert('Error', 'Please select a faculty member');
      return;
    }

    setFacultySearchLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/getFacultyProfile/${selectedFaculty.user_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      const data = await response.json();

      if (data.success) {
        setSpecificFacultyData(data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch faculty profile');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Network error.  Please try again.');
    } finally {
      setFacultySearchLoading(false);
    }
  };

  const resetFacultySearch = () => {
    setSelectedFaculty(null);
    setSpecificFacultyData(null);
  };

  const openFacultyModal = () => {
    setFacultySearchText('');
    setFacultyModalVisible(true);
  };

  const closeFacultyModal = () => {
    setFacultySearchText('');
    setFacultyModalVisible(false);
  };

  const selectFaculty = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    closeFacultyModal();
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const clearFacultySearch = () => {
    setFacultySearchText('');
  };

  const getFilterTypeLabel = (type) => {
    return FILTER_OPTIONS.find((item) => item.key === type)?.label || 'No Filter';
  };

  const openFilterTypeDropdown = (target) => {
    setFilterDropdownTarget(target);
    setFilterDropdownVisible(true);
  };

  const closeFilterTypeDropdown = () => {
    setFilterDropdownVisible(false);
  };

  const selectFilterType = (optionKey) => {
    const nextState = {
      ...DEFAULT_EXPORT_FILTER,
      type: optionKey,
      value: optionKey === 'status' ? 'all' : optionKey === 'meeting_alloted' ? 'all' : '',
    };

    if (filterDropdownTarget === 'complaints') {
      setComplaintExportFilter(nextState);
    } else {
      setMeetingExportFilter(nextState);
    }

    closeFilterTypeDropdown();
  };

  const getFilterQueryParams = (filter) => {
    const params = new URLSearchParams();

    switch (filter.type) {
      case 'status':
        if (filter.value) params.append('status', filter.value);
        break;
      case 'student_id':
        if (filter.value.trim()) params.append('student_id', filter.value.trim());
        break;
      case 'student_name':
        if (filter.value.trim()) params.append('student_name', filter.value.trim());
        break;
      case 'faculty_id':
        if (filter.value.trim()) params.append('faculty_id', filter.value.trim());
        break;
      case 'faculty_name':
        if (filter.value.trim()) params.append('faculty_name', filter.value.trim());
        break;
      case 'meeting_alloted':
        if (filter.value) params.append('meeting_alloted', filter.value);
        break;
      case 'date_range':
        if (filter.from.trim()) params.append('from_date', filter.from.trim());
        if (filter.to.trim()) params.append('to_date', filter.to.trim());
        break;
      case 'time_range':
        if (filter.from.trim()) params.append('from_time', filter.from.trim());
        if (filter.to.trim()) params.append('to_time', filter.to.trim());
        break;
      case 'date_time_range':
        if (filter.from.trim()) params.append('from_date_time', filter.from.trim());
        if (filter.to.trim()) params.append('to_date_time', filter.to.trim());
        break;
      default:
        break;
    }

    return params.toString();
  };

  const renderFilterSubOptions = (filter, setFilter) => {
    if (filter.type === 'status') {
      return (
        <View style={styles.filterChipRow}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={`status-${option}`}
              style={[styles.filterChip, filter.value === option && styles.filterChipActive]}
              onPress={() => setFilter({ ...filter, value: option })}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, filter.value === option && styles.filterChipTextActive]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (filter.type === 'meeting_alloted') {
      return (
        <View style={styles.filterChipRow}>
          {meetingAllotedOptions.map((option) => (
            <TouchableOpacity
              key={`meeting-alloted-${option}`}
              style={[styles.filterChip, filter.value === option && styles.filterChipActive]}
              onPress={() => setFilter({ ...filter, value: option })}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, filter.value === option && styles.filterChipTextActive]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (filter.type === 'student_id' || filter.type === 'student_name' || filter.type === 'faculty_id' || filter.type === 'faculty_name') {
      return (
        <TextInput
          style={styles.exportFilterInput}
          placeholder={`Enter ${FILTER_OPTIONS.find((opt) => opt.key === filter.type)?.label || 'value'}`}
          placeholderTextColor="#9ca3af"
          value={filter.value}
          onChangeText={(text) => setFilter({ ...filter, value: text })}
        />
      );
    }

    if (filter.type === 'date_range' || filter.type === 'time_range' || filter.type === 'date_time_range') {
      const fromPlaceholder = filter.type === 'date_range'
        ? 'From (YYYY-MM-DD)'
        : filter.type === 'time_range'
          ? 'From (HH:mm:ss)'
          : 'From (YYYY-MM-DD HH:mm:ss)';

      const toPlaceholder = filter.type === 'date_range'
        ? 'To (YYYY-MM-DD)'
        : filter.type === 'time_range'
          ? 'To (HH:mm:ss)'
          : 'To (YYYY-MM-DD HH:mm:ss)';

      return (
        <View style={styles.exportRangeRow}>
          <TextInput
            style={[styles.exportFilterInput, styles.exportRangeInput]}
            placeholder={fromPlaceholder}
            placeholderTextColor="#9ca3af"
            value={filter.from}
            onChangeText={(text) => setFilter({ ...filter, from: text })}
          />
          <TextInput
            style={[styles.exportFilterInput, styles.exportRangeInput]}
            placeholder={toPlaceholder}
            placeholderTextColor="#9ca3af"
            value={filter.to}
            onChangeText={(text) => setFilter({ ...filter, to: text })}
          />
        </View>
      );
    }

    return null;
  };

  const exportExcelFile = async ({ endpoint, filter, fallbackName, setLoading }) => {
    setLoading(true);
    try {
      const query = getFilterQueryParams(filter);
      const requestUrl = `${API_URL}${endpoint}${query ? `?${query}` : ''}`;
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok || !data?.success || !data?.fileBase64) {
        const backendMessage = data?.error?.message || data?.message;
        throw new Error(backendMessage || 'Unable to generate the Excel file');
      }

      const fileName = data.fileName || `${fallbackName}_${Date.now()}.xlsx`;
      try {
        await Share.open({
          url: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.fileBase64}`,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: fileName,
          useInternalStorage: true,
          failOnCancel: false,
          title: 'Download Excel',
        });
      } catch (shareError) {
        throw new Error(shareError?.message || 'File generated but failed to open share dialog');
      }
    } catch (error) {
      console.error('Excel export failed:', error);
      Alert.alert('Export Failed', error.message || 'Unable to download the Excel file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadComplaintsExcel = async () => {
    await exportExcelFile({
      endpoint: '/api/admin/download_complaints_excel',
      filter: complaintExportFilter,
      fallbackName: 'dc_portal_complaints',
      setLoading: setComplaintsExportLoading,
    });
  };

  const handleDownloadMeetingsExcel = async () => {
    await exportExcelFile({
      endpoint: '/api/admin/download_meetings_excel',
      filter: meetingExportFilter,
      fallbackName: 'dc_portal_meetings',
      setLoading: setMeetingsExportLoading,
    });
  };

  // ==================== SHARED FUNCTIONS ====================

  const calculateTotalComplaints = (counts) => {
    return Number(counts.accepted_count || 0) + 
           Number(counts.rejected_count || 0) + 
           Number(counts.resolved_count || 0) + 
           Number(counts. pending_count || 0);
  };

  const CountCard = ({ count, label, icon, gradientColors }) => (
    <View style={styles.countCardWrapper}>
      <LinearGradient
        colors={gradientColors}
        style={styles.countCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y:  1 }}
      >
        <View style={styles.countCardIcon}>
          <Ionicons name={icon} size={28} color="#fff" />
        </View>
        <View style={styles.countCardContent}>
          <Text style={styles. countNumber}>{count}</Text>
          <Text style={styles.countLabel}>{label}</Text>
        </View>
      </LinearGradient>
    </View>
  );

 const renderCountsGrid = (counts, userInfo, userType) => {  // ✅ Add userInfo and userType params
  const totalComplaints = calculateTotalComplaints(counts);
  
  return (
    <View style={styles.countsGrid}>
      <View style={styles.countsRow}>
        <CountCard
          count={counts.accepted_count || 0}
          label="Accepted"
          icon="checkmark-circle"
          gradientColors={['#10b981', '#059669']}
        />
        <CountCard
          count={counts.rejected_count || 0}
          label="Rejected"
          icon="close-circle"
          gradientColors={['#ef4444', '#dc2626']}
        />
      </View>
      <View style={styles.countsRow}>
        <CountCard
          count={counts.pending_count || 0}
          label="Pending"
          icon="time"
          gradientColors={['#f59e0b', '#d97706']}
        />
        <CountCard
          count={counts.resolved_count || 0}
          label="Resolved"
          icon="checkmark-done-circle"
          gradientColors={['#8b5cf6', '#7c3aed']}
        />
      </View>
      <View style={styles.countsRow}>
        {/* ✅ UPDATED: Make Total Complaints clickable */}
        <TouchableOpacity 
          style={styles.countCardWrapper}
          onPress={() => {
            if (userInfo && userType) {
              navigation.navigate('UserComplaintHistory', {
                userId: userInfo.user_id || userInfo.student_id || userInfo.faculty_id,
                userType:  userType,
                userName: userInfo.name || userInfo.student_name || userInfo. faculty_name
              });
            }
          }}
          activeOpacity={userInfo && userType ? 0.7 : 1}
          disabled={!userInfo || !userType}
        >
          <LinearGradient
            colors={['#6366f1', '#4f46e5']}
            style={styles.countCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y:  1 }}
          >
            <View style={styles.countCardIcon}>
              <Ionicons name="stats-chart" size={28} color="#fff" />
            </View>
            <View style={styles.countCardContent}>
              <Text style={styles.countNumber}>{totalComplaints}</Text>
              <Text style={styles.countLabel}>Total Complaints</Text>
            </View>
            {userInfo && userType && (
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" style={{ marginLeft: 8 }} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

  // ==================== RENDER FUNCTIONS ====================

  const renderStudentItem = ({ item }) => {
    const highlightText = (text, searchText) => {
      if (!searchText) return text;
      
      const parts = text.split(new RegExp(`(${searchText})`, 'gi'));
      return (
        <Text>
          {parts.map((part, index) => 
            part.toLowerCase() === searchText.toLowerCase() ? (
              <Text key={index} style={styles.highlightedText}>{part}</Text>
            ) : (
              <Text key={index}>{part}</Text>
            )
          )}
        </Text>
      );
    };

    return (
      <TouchableOpacity
        style={styles.studentItem}
        onPress={() => selectStudent(item)}
        activeOpacity={0.7}
      >
        <View style={styles.studentAvatarContainer}>
          <View style={styles.studentAvatar}>
            <Ionicons name="person" size={20} color="#6366f1" />
          </View>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {highlightText(item.name, searchText)}
          </Text>
          <View style={styles.studentRegContainer}>
            <Ionicons name="id-card-outline" size={14} color="#6c757d" />
            <Text style={styles.studentRegNum}>
              {highlightText(item.reg_num, searchText)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6c757d" />
      </TouchableOpacity>
    );
  };

  // ✅ NEW: Render faculty item
  const renderFacultyItem = ({ item }) => {
    const highlightText = (text, searchText) => {
      if (!searchText) return text;
      
      const parts = text. split(new RegExp(`(${searchText})`, 'gi'));
      return (
        <Text>
          {parts.map((part, index) => 
            part.toLowerCase() === searchText.toLowerCase() ? (
              <Text key={index} style={styles. highlightedText}>{part}</Text>
            ) : (
              <Text key={index}>{part}</Text>
            )
          )}
        </Text>
      );
    };

    return (
      <TouchableOpacity
        style={styles.studentItem}
        onPress={() => selectFaculty(item)}
        activeOpacity={0.7}
      >
        <View style={styles.studentAvatarContainer}>
          <View style={styles.studentAvatar}>
            <Ionicons name="person" size={20} color="#6366f1" />
          </View>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {highlightText(item.name, facultySearchText)}
          </Text>
          <View style={styles.studentRegContainer}>
            <Ionicons name="id-card-outline" size={14} color="#6c757d" />
            <Text style={styles.studentRegNum}>
              ID: {item.user_id}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6c757d" />
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#6366f1', '#dd7288ff']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <Image
            source={require("../../assets/profile.jpeg")}
            style={styles.profileImage}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>Welcome Back</Text>
            <Text style={styles.headerSubText}>{adminName}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}  
            onRefresh={handleRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
      >
        {/* ==================== STUDENT SECTION ==================== */}
        
        {/* Total Student Counts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={24} color="#6366f1" />
            <Text style={styles.sectionTitle}>Student Overview</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
          ) : allStudentsCounts ?  (
            renderCountsGrid(allStudentsCounts. counts, null, null)
          ) : (
            <TouchableOpacity style={styles.retryButton} onPress={fetchAllStudentsCounts}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Retry Loading</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Specific Student */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={24} color="#6366f1" />
            <Text style={styles.sectionTitle}>Student Profile</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.modernDropdownButton} 
            onPress={openModal}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownContent}>
              <View style={styles.dropdownIconContainer}>
                <Ionicons 
                  name={selectedStudent ? "person" : "person-add-outline"} 
                  size={22} 
                  color="#6366f1" 
                />
              </View>
              <View style={styles.dropdownTextContainer}>
                <Text style={styles.dropdownLabel}>
                  {selectedStudent ?  'Selected Student' : 'Select Student'}
                </Text>
                <Text style={[
                  styles.dropdownValue, 
                  ! selectedStudent && styles.placeholderValue
                ]}>
                  {selectedStudent 
                    ? selectedStudent.name
                    : 'Tap to choose a student'
                  }
                </Text>
                {selectedStudent && (
                  <Text style={styles.dropdownRegNum}>
                    {selectedStudent.reg_num}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#6366f1" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.modernSearchButton,
              (! selectedStudent || searchLoading) && styles.disabledButton
            ]} 
            onPress={fetchSpecificStudent}
            disabled={!selectedStudent || searchLoading}
            activeOpacity={0.8}
          >
            {searchLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.modernButtonText}>Search Profile</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Student Profile Results */}
          {specificStudentData && (
            <View style={styles.profileContainer}>
              <View style={styles.profileHeaderCard}>
                <View style={styles.profileAvatarLarge}>
                  <Ionicons name="person" size={40} color="#6366f1" />
                </View>
                <View style={styles.profileHeaderInfo}>
                  <Text style={styles.profileName}>
                    {specificStudentData.student_name}
                  </Text>
                  <View style={styles.profileIdContainer}>
                    <Ionicons name="id-card" size={16} color="#6c757d" />
                    <Text style={styles.profileId}>
                      ID: {specificStudentData.student_id}
                    </Text>
                  </View>
                  <View style={styles.profileRegContainer}>
                    <Ionicons name="document-text" size={16} color="#6c757d" />
                    <Text style={styles. profileReg}>
                      {specificStudentData.student_reg_num}
                    </Text>
                  </View>
                </View>
              </View>
              
              {specificStudentData.message && (
                <View style={styles.messageCard}>
                  <Ionicons name="information-circle" size={20} color="#6366f1" />
                  <Text style={styles. messageText}>
                    {specificStudentData.message}
                  </Text>
                </View>
              )}

              {renderCountsGrid(
                specificStudentData.counts, 
                { 
                  user_id: specificStudentData. student_id, 
                  name: specificStudentData.student_name 
                }, 
                'student'
              )}

              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={resetSpecificSearch}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.resetButtonText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ==================== FACULTY SECTION ==================== */}

        {/* Search Specific Faculty */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={24} color="#8b5cf6" />
            <Text style={[styles. sectionTitle, { color: '#8b5cf6' }]}>Faculty Profile</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.modernDropdownButton, { borderColor: '#e9d5ff' }]} 
            onPress={openFacultyModal}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownContent}>
              <View style={[styles.dropdownIconContainer, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons 
                  name={selectedFaculty ? "person" : "person-add-outline"} 
                  size={22} 
                  color="#8b5cf6" 
                />
              </View>
              <View style={styles.dropdownTextContainer}>
                <Text style={styles.dropdownLabel}>
                  {selectedFaculty ? 'Selected Faculty' : 'Select Faculty'}
                </Text>
                <Text style={[
                  styles.dropdownValue, 
                  !selectedFaculty && styles.placeholderValue
                ]}>
                  {selectedFaculty 
                    ? selectedFaculty.name
                    : 'Tap to choose a faculty'
                  }
                </Text>
                {selectedFaculty && (
                  <Text style={styles.dropdownRegNum}>
                    ID: {selectedFaculty.user_id}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#8b5cf6" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.modernSearchButton,
              { backgroundColor: '#8b5cf6', shadowColor: '#8b5cf6' },
              (! selectedFaculty || facultySearchLoading) && styles.disabledButton
            ]} 
            onPress={fetchSpecificFaculty}
            disabled={!selectedFaculty || facultySearchLoading}
            activeOpacity={0.8}
          >
            {facultySearchLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.modernButtonText}>Search Profile</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Faculty Profile Results */}
          {specificFacultyData && (
            <View style={styles.profileContainer}>
              <View style={styles. profileHeaderCard}>
                <View style={[styles.profileAvatarLarge, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="person" size={40} color="#8b5cf6" />
                </View>
                <View style={styles.profileHeaderInfo}>
                  <Text style={styles.profileName}>
                    {specificFacultyData.faculty_name}
                  </Text>
                  <View style={styles.profileIdContainer}>
                    <Ionicons name="id-card" size={16} color="#6c757d" />
                    <Text style={styles.profileId}>
                      ID: {specificFacultyData.faculty_id}
                    </Text>
                  </View>
                </View>
              </View>
              
              {specificFacultyData.message && (
                <View style={[styles.messageCard, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="information-circle" size={20} color="#8b5cf6" />
                  <Text style={[styles.messageText, { color: '#7c3aed' }]}>
                    {specificFacultyData.message}
                  </Text>
                </View>
              )}

              {renderCountsGrid(
                specificFacultyData.counts, 
                { 
                  user_id: specificFacultyData.faculty_id, 
                  name: specificFacultyData.faculty_name 
                }, 
                'faculty'
              )}

              <TouchableOpacity 
                style={styles. resetButton} 
                onPress={resetFacultySearch}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles. resetButtonText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="download-outline" size={24} color="#6366f1" />
              <Text style={styles.sectionTitle}>Export Data</Text>
            </View>

            <View style={styles.exportCard}>
              <Text style={styles.exportCardTitle}>Complaints Excel</Text>
              <Text style={styles.exportCardSubTitle}>Choose filter type, then select sub-options</Text>
              <TouchableOpacity
                style={styles.filterTypeDropdownButton}
                onPress={() => openFilterTypeDropdown('complaints')}
                activeOpacity={0.8}
              >
                <View style={styles.filterTypeDropdownContent}>
                  <Text style={styles.filterTypeDropdownLabel}>Filter Type</Text>
                  <Text style={styles.filterTypeDropdownValue}>{getFilterTypeLabel(complaintExportFilter.type)}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#6366f1" />
              </TouchableOpacity>

              <View style={styles.exportSubOptionsContainer}>
                {renderFilterSubOptions(complaintExportFilter, setComplaintExportFilter)}
              </View>

              <TouchableOpacity
                style={[styles.exportActionButton, complaintsExportLoading && styles.disabledExportButton]}
                onPress={handleDownloadComplaintsExcel}
                activeOpacity={0.85}
                disabled={complaintsExportLoading}
              >
                {complaintsExportLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color="#fff" />
                    <Text style={styles.exportActionButtonText}>Download Complaints</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.exportCard}>
              <Text style={styles.exportCardTitle}>Meetings Excel</Text>
              <Text style={styles.exportCardSubTitle}>Choose filter type, then select sub-options</Text>
              <TouchableOpacity
                style={styles.filterTypeDropdownButton}
                onPress={() => openFilterTypeDropdown('meetings')}
                activeOpacity={0.8}
              >
                <View style={styles.filterTypeDropdownContent}>
                  <Text style={styles.filterTypeDropdownLabel}>Filter Type</Text>
                  <Text style={styles.filterTypeDropdownValue}>{getFilterTypeLabel(meetingExportFilter.type)}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#6366f1" />
              </TouchableOpacity>

              <View style={styles.exportSubOptionsContainer}>
                {renderFilterSubOptions(meetingExportFilter, setMeetingExportFilter)}
              </View>

              <TouchableOpacity
                style={[styles.exportActionButton, meetingsExportLoading && styles.disabledExportButton]}
                onPress={handleDownloadMeetingsExcel}
                activeOpacity={0.85}
                disabled={meetingsExportLoading}
              >
                {meetingsExportLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={18} color="#fff" />
                    <Text style={styles.exportActionButtonText}>Download Meetings</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
      </ScrollView>

      {/* ==================== STUDENT MODAL ==================== */}
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="people" size={24} color="#6366f1" />
                <Text style={styles.modalTitle}>Select Student</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search" size={20} color="#6c757d" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or registration..."
                  placeholderTextColor="#9ca3af"
                  value={searchText}
                  onChangeText={setSearchText}
                />
                {searchText. length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearIconButton}
                    onPress={clearSearch}
                  >
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {searchText.length > 0 && (
              <View style={styles. resultsInfo}>
                <Ionicons name="funnel" size={16} color="#6366f1" />
                <Text style={styles.resultsText}>
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' :  ''} found
                </Text>
              </View>
            )}
            
            {studentsLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading students...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredStudents}
                renderItem={renderStudentItem}
                keyExtractor={(item) => `${item.user_id}`}
                style={styles.studentsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={64} color="#d1d5db" />
                    <Text style={styles.emptyText}>
                      {searchText ?  'No students found' : 'No students available'}
                    </Text>
                    <Text style={styles.emptySubText}>
                      {searchText ?  'Try adjusting your search' : 'Please contact support'}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ==================== FACULTY MODAL ==================== */}
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={facultyModalVisible}
        onRequestClose={closeFacultyModal}
      >
        <View style={styles. modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="people" size={24} color="#8b5cf6" />
                <Text style={[styles.modalTitle, { color: '#8b5cf6' }]}>Select Faculty</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeFacultyModal}
              >
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search" size={20} color="#6c757d" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name..."
                  placeholderTextColor="#9ca3af"
                  value={facultySearchText}
                  onChangeText={setFacultySearchText}
                />
                {facultySearchText.length > 0 && (
                  <TouchableOpacity 
                    style={styles. clearIconButton}
                    onPress={clearFacultySearch}
                  >
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {facultySearchText.length > 0 && (
              <View style={styles.resultsInfo}>
                <Ionicons name="funnel" size={16} color="#8b5cf6" />
                <Text style={styles.resultsText}>
                  {filteredFaculty.length} faculty member{filteredFaculty.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            )}
            
            {facultyLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.loadingText}>Loading faculty...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredFaculty}
                renderItem={renderFacultyItem}
                keyExtractor={(item) => `${item.user_id}`}
                style={styles.studentsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View style={styles. emptyContainer}>
                    <Ionicons name="search-outline" size={64} color="#d1d5db" />
                    <Text style={styles.emptyText}>
                      {facultySearchText ? 'No faculty found' : 'No faculty available'}
                    </Text>
                    <Text style={styles.emptySubText}>
                      {facultySearchText ? 'Try adjusting your search' : 'Please contact support'}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={filterDropdownVisible}
        onRequestClose={closeFilterTypeDropdown}
      >
        <Pressable
          style={styles.filterTypeModalOverlay}
          onPress={closeFilterTypeDropdown}
        >
          <Pressable style={styles.filterTypeModalCard} onPress={() => {}}>
            <Text style={styles.filterTypeModalTitle}>Select Filter Type</Text>
            {FILTER_OPTIONS.map((option) => {
              const isSelected =
                filterDropdownTarget === 'complaints'
                  ? complaintExportFilter.type === option.key
                  : meetingExportFilter.type === option.key;

              return (
                <TouchableOpacity
                  key={`filter-option-${option.key}`}
                  style={[styles.filterTypeModalItem, isSelected && styles.filterTypeModalItemSelected]}
                  onPress={() => selectFilterType(option.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterTypeModalItemText, isSelected && styles.filterTypeModalItemTextSelected]}>
                    {option.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#6366f1" />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// ✅ Keep all existing styles (same as before)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  headerGradient: {
    paddingTop: 14,
    paddingBottom: 18,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  exportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exportCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  exportCardSubTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 10,
  },
  filterTypeDropdownButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  filterTypeDropdownContent: {
    flex: 1,
  },
  filterTypeDropdownLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  filterTypeDropdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  filterTypeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  filterTypeModalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  filterTypeModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  filterTypeModalItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTypeModalItemSelected: {
    backgroundColor: '#eef2ff',
  },
  filterTypeModalItemText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterTypeModalItemTextSelected: {
    color: '#4338ca',
    fontWeight: '700',
  },
  exportSubOptionsContainer: {
    marginTop: 10,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterChipText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  exportFilterInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  exportRangeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportRangeInput: {
    flex: 1,
  },
  exportActionButton: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledExportButton: {
    opacity: 0.7,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  headerSubText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection:  'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366f1',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingText: {
    marginTop: 12,
    color: '#6c757d',
    fontSize: 15,
    fontWeight: '500',
  },
  countsGrid: {
    width: '100%',
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  countCardWrapper: {
    flex: 1,
  },
  countCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity:  0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 16,
  },
  countCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countCardContent: {
    flex: 1,
  },
  countNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  countLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  modernDropdownButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding:  16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems:  'center',
    justifyContent: 'center',
  },
  dropdownTextContainer:  {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight:  '600',
    marginBottom: 4,
  },
  dropdownValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  placeholderValue: {
    color: '#9ca3af',
  },
  dropdownRegNum: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  modernSearchButton: {
    backgroundColor:  '#6366f1',
    borderRadius:  16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity:  0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  modernButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor:  '#6c757d',
    borderRadius:  16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize:  16,
    fontWeight:  '700',
  },
  profileContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems:  'center',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 16,
  },
  profileAvatarLarge:  {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderInfo:  {
    flex: 1,
  },
  profileName:  {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  profileIdContainer: {
    flexDirection:  'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  profileRegContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileReg: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    padding:  16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: '#6c757d',
    borderRadius: 12,
    paddingVertical:  14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent:  'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor:  '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding:  20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6366f1',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    marginBottom:  16,
  },
  searchInputWrapper: {
    flexDirection:  'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  clearIconButton: {
    padding:  4,
  },
  resultsInfo: {
    flexDirection:  'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  modalLoadingContainer: {
    alignItems: 'center',
    padding: 48,
  },
  studentsList: {
    maxHeight: 450,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems:  'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    gap:  12,
  },
  studentAvatarContainer: {
    marginRight: 4,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  studentRegContainer: {
    flexDirection: 'row',
    alignItems:  'center',
    gap:  6,
  },
  studentRegNum: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight:  '500',
  },
  highlightedText: {
    backgroundColor: '#fef3c7',
    fontWeight: '700',
    color: '#d97706',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color:  '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AdminDashboard;