import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { formatDate } from '../lib/utils';

export interface DatePickerProps {
  value: string; // ISO string or YYYY-MM-DD
  onChange: (dateStr: string) => void;
  placeholder?: string;
  label?: string;
  style?: any;
}

export default function DatePicker({ value, onChange, placeholder = 'Select Date', label, style }: DatePickerProps) {
  const colors = useThemeStore(state => state.getColors());
  const [show, setShow] = useState(false);
  
  const currentDate = value && !isNaN(new Date(value).getTime()) ? new Date(value) : new Date();
  
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      // Create local date string avoiding UTC shifts
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else if (event.type === 'dismissed') {
      // User cancelled
    }
  };

  const handleIOSDone = () => {
    setShow(false);
  };

  return (
    <View style={style}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      
      <TouchableOpacity 
        style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]} 
        onPress={() => setShow(true)}
      >
        <Text style={[styles.inputText, { color: value ? colors.text : colors.textSecondary }]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Feather name="calendar" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      {show && Platform.OS === 'ios' ? (
        <Modal transparent animationType="slide" visible={show}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleIOSDone}>
                  <Text style={[styles.modalDone, { color: colors.tint }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                onChange={(e, d) => {
                  if (d) {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    onChange(`${year}-${month}-${day}`);
                  }
                }}
                textColor={colors.text}
              />
            </View>
          </View>
        </Modal>
      ) : show && Platform.OS === 'android' ? (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  inputText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalDone: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
