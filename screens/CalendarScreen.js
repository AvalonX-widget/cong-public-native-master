import React from 'react';
import { AsyncStorage } from 'react-native';
import { CalendarList, LocaleConfig } from 'react-native-calendars';
import { Row, Grid } from 'react-native-easy-grid';
import { database } from '../config/firebase';
import { Container, Header, Content, Body, Title, List, ListItem, Text, Left, Right, Button, Icon, Card, CardItem, View } from 'native-base';
import moment from 'moment';

LocaleConfig.locales['ko'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1','2','3','4','5','6','7','8','9','10','11','12'],
  dayNames: ['일','월','화','수','목','금','토'],
  dayNamesShort: ['일','월','화','수','목','금','토']
};

LocaleConfig.defaultLocale = 'ko';

export default class CalendarScreen extends React.Component {
  state = {
    markedDates: {},
    selectedSchedules: [],
    isAdmin: false,
    isLoading: true,
  };

  schedulesRefs = {};
  schedules = {};

  async componentWillMount() {
    const userName = await AsyncStorage.getItem('name');
    if (!userName.length) this.props.navigation.navigate('Login');

    const isAdmin = await AsyncStorage.getItem('isAdmin') === '1';
    this.setState({isAdmin});
  }

  async componentWillUnmount() {
    for (const dateString in this.schedulesRefs) {
      await this.schedulesRefs[dateString].off();
    }
  }

  render() {
    return (
      <Container>
        <Header>
          <Left style={{flex: 1}} />
          <Body style={{ alignItems: 'center'}}>
            <Title>전체스케줄</Title>
          </Body>
          <Right>
            {
              this.state.isAdmin &&
              <Button transparent onPress={this._onGoToAdd}>
                <Icon name='add' type="MaterialIcons" />
              </Button>
            }
          </Right>
        </Header>
        <Grid>
          <Row size={2}>
            <CalendarList
              markedDates={this.state.markedDates}
              onVisibleMonthsChange={this._onVisibleMonthsChange}
              onDayPress={this._onDayPress}
              displayLoadingIndicator={this.state.isLoading}
              pastScrollRange={2}
              futureScrollRange={2}
              markingType={'multi-dot'}
              monthFormat={'yyyy년 M월'}
              firstDay={0}
            />
          </Row>
          <Row size={1}>
            <Content>
            {
              this.state.selectedSchedules.length ?
              <List
                dataArray={this.state.selectedSchedules.sort((a, b) => a.startTime - b.startTime)}
                renderRow={this._renderRow}
              /> :
              <Card>
                <CardItem>
                  <Text>스케줄이 없습니다.</Text>
                </CardItem>
              </Card>
            }
            </Content>
          </Row>
        </Grid>
      </Container>
    );
  }

  _renderRow = (item, sectionId, rowId) => {
    return (
      <View>
        {
          rowId === '0' &&
          <ListItem itemDivider>
            <Text>{item.dateString}</Text>
          </ListItem>
        }
        <ListItem icon button onPress={() => this._onScheduleSelect(item)}>
          <Left>
            <Icon active name="assignment-ind" type="MaterialIcons" />
          </Left>
          <Body>
            <Text>{item.startTime}:00 ~ {item.endTime}:00</Text>
            <Text note>{item.location}</Text>
          </Body>
          <Right>
            <Icon active name="arrow-forward" />
          </Right>
        </ListItem>
      </View>
    );
  }

  _onScheduleSelect = schedule => {
    this.props.navigation.push('Detail', {schedule});
  }

  _onVisibleMonthsChange = months => {
    for (const month of months) {
      const yearMonth = moment(month.dateString).format('YYYYMM');
      if (!this.schedulesRefs[yearMonth]) this._displaySchedules(yearMonth);
    }
  }

  _onDayPress = day => {
    const markedDates = this.state.markedDates;

    // display schedules of the day
    if (this.schedules[day.dateString]) {
      this.setState({selectedSchedules: this.schedules[day.dateString]});
    } else {
      this.setState({selectedSchedules: []});
    }

    // mark selected day
    markedDates[day.dateString] = {...markedDates[day.dateString]} || {};
    markedDates[day.dateString].selected = true;

    for (const dateString in markedDates) {
      if (day.dateString !== dateString) {
        if (markedDates[dateString].dots) {
          markedDates[dateString] = {...markedDates[dateString]};
          delete markedDates[dateString].selected;
        } else {
          delete markedDates[dateString];
        }
      }
    }

    this.setState({markedDates: {...markedDates}});
  }

  _onGoToAdd = () => {
    this.props.navigation.push('Add');
  }

  _displaySchedules = yearMonth => {
    this.schedulesRefs[yearMonth] = database.ref(`schedules/${yearMonth}`);
    const markedDates = this.state.markedDates;

    this.schedulesRefs[yearMonth].on('value', async monthSnap => {
      // deleting removed schedule first
      const firstDay = moment(yearMonth + '01');
      const cur = moment(yearMonth + '01');
      while (firstDay.isSame(cur, 'month')) {
        const dateString = cur.add(1, 'days').format('YYYY-MM-DD');
        if (markedDates[dateString]) delete markedDates[dateString];
        if (this.schedules[dateString]) delete this.schedules[dateString];
      }

      // schedule loop
      await monthSnap.forEach(daySnap => {
        const schedules = daySnap.val();

        for (const key in schedules) {
          const schedule = schedules[key];
          schedule['key'] = key;

          // save schedule first
          if (!this.schedules[schedule.dateString]) this.schedules[schedule.dateString] = [];
          if (!this.schedules[schedule.dateString].find(cur => cur.key === key)) {
            this.schedules[schedule.dateString].push(schedule);
          }

          // count users and approved users
          let userCount = 0;
          let approvedCount = 0;
          for (const user in schedule.users) {
            userCount++;
            if (schedule.users[user].approved) approvedCount++;
          }

          // add marks
          if (!markedDates[schedule.dateString]) markedDates[schedule.dateString] = {dots: []};

          if (!markedDates[schedule.dateString].dots.find(cur => cur.key === key)) {
            if (userCount < 6) {
              markedDates[schedule.dateString]['dots'].push({key, color: '#385a7c'});
            } else if (approvedCount > 5) {
              markedDates[schedule.dateString]['dots'].push({key, color: '#e8606a'});
            } else {
              markedDates[schedule.dateString]['dots'].push({key, color: '#e5e561'});
            }
          }
        }
      });

      this.setState({markedDates: {...markedDates}, isLoading: false});
    });
  }
}
