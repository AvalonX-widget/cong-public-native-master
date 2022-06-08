import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';
import AddScreen from '../screens/AddScreen';
import DetailScreen from '../screens/DetailScreen';
import AnnouncementScreen from '../screens/AnnouncementScreen';

import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TagScreen from '../screens/TagScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const HomeStack = createStackNavigator({
  Home: {
    screen: HomeScreen,
    navigationOptions: {
      header: null,
    },
  },
  Detail: {
    screen: DetailScreen,
    navigationOptions: {
      header: null,
    },
  },
});

HomeStack.navigationOptions = {
  tabBarLabel: '나의스케줄',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={
        Platform.OS === 'ios'
          ? `ios-create`
          : 'md-create'
      }
    />
  ),
};

const CalendarStack = createStackNavigator({
  Calendar: {
    screen: CalendarScreen,
    navigationOptions: {
      header: null,
    },
  },
  Add: {
    screen: AddScreen,
    navigationOptions: {
      header: null,
    },
  },
  Detail: {
    screen: DetailScreen,
    navigationOptions: {
      header: null,
    },
  },
});

CalendarStack.navigationOptions = {
  tabBarLabel: '전체스케줄',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-calendar' : 'md-calendar'}
    />
  ),
};

const SettingsStack = createStackNavigator({
  Settings: {
    screen: SettingsScreen,
    navigationOptions: {
      header: null,
    },
  },
  Announcement: {
    screen: AnnouncementScreen,
    navigationOptions: {
      header: null,
    },
  },
  Tag: {
    screen: TagScreen,
    navigationOptions: {
      header: null,
    },
  },
  Notifications: {
    screen: NotificationsScreen,
    navigationOptions: {
      header: null,
    },
  },
});

SettingsStack.navigationOptions = {
  tabBarLabel: '설정',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-settings' : 'md-settings'}
    />
  ),
};

export default createBottomTabNavigator({
  HomeStack,
  CalendarStack,
  SettingsStack,
});
