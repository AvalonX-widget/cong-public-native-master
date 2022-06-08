import React from 'react';
import { CalendarList, LocaleConfig } from 'react-native-calendars';
import { database } from '../config/firebase';
import { Container, Header, Content, Body, Title, Left, Right, Button, Icon, Form, Label, Input, Item, Picker, Toast } from 'native-base';
import moment from 'moment';

LocaleConfig.locales['ko'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1','2','3','4','5','6','7','8','9','10','11','12'],
  dayNames: ['일','월','화','수','목','금','토'],
  dayNamesShort: ['일','월','화','수','목','금','토']
};

LocaleConfig.defaultLocale = 'ko';

export default class AddScreen extends React.Component {
  state = {
    isLoading: false,
    location: '',
    startTime: 0,
    endTime: 0,
    recurringCount: 1,
    selectedDate: '',
    markedDates: {},
  };

  render() {
    const startHour = 8;
    const endHour = 23;
    const hours = [];

    for (let i = startHour; i < endHour; i++) {
      hours.push(i);
    }

    return (
      <Container>
        <Header>
          <Left style={{flex: 1}}>
            <Button transparent onPress={this._onGoBack}>
              <Icon name='arrow-back' type='MaterialIcons' />
            </Button>
          </Left>
          <Body style={{ alignItems: 'center'}}>
            <Title>스케줄생성</Title>
          </Body>
          <Right>
            <Button transparent onPress={this._onAddSchedule} disabled={this.state.isLoading}>
              <Icon name='calendar-plus-o' type='FontAwesome' />
            </Button>
          </Right>
        </Header>
        <Content>
          <CalendarList
            horizontal
            pagingEnabled
            pastScrollRange={0}
            futureScrollRange={3}
            monthFormat={'yyyy년 M월'}
            firstDay={0}
            minDate={moment().format('YYYY-MM-DD')}
            onDayPress={this._onDayPress}
            markedDates={this.state.markedDates}
          />
          <Form>
            <Item>
              <Label>날자</Label>
              <Input disabled placeholder='달력에서 날자를 선택해 주세요...' value={this.state.selectedDate} />
            </Item>
            <Item>
              <Label>장소</Label>
              <Input placeholder='장소를 입력해 주세요...' value={this.state.location} onChangeText={location => this.setState({location})} />
            </Item>
            <Item>
              <Label>시작시간</Label>
              <Picker
                note
                mode='dropdown'
                placeholder='시작시간을 선택해 주세요...'
                selectedValue={this.state.startTime}
                onValueChange={startTime => this.setState({startTime})}
              >
              {
                hours.map((h, i) =>
                  <Picker.Item
                    label={h.toString() + ':00'}
                    value={h}
                    key={i}
                  />
                )
              }
              </Picker>
            </Item>
            <Item error={this.state.startTime > 0 && this.state.startTime >= this.state.endTime}>
              <Label>종료시간</Label>
              <Picker
                note
                mode='dropdown'
                placeholder='종료시간을 선택해 주세요...'
                selectedValue={this.state.endTime}
                onValueChange={endTime => this.setState({endTime})}
                enabled={this.state.startTime > 0}
              >
              {
                hours.map((h, i) =>
                  <Picker.Item
                    label={h.toString() + ':00'}
                    value={h}
                    key={i}
                  />
                )
              }
              </Picker>
              {this.state.startTime > 0 && this.state.startTime >= this.state.endTime && <Icon name='close-circle' />}
            </Item>
            <Item>
              <Label>반복횟수</Label>
              <Picker
                note
                mode='dropdown'
                selectedValue={this.state.recurringCount}
                onValueChange={recurringCount => this.setState({recurringCount})}
              >
              {
                [1,2,3,4,5,6,7,8,9].map((t, i) =>
                  <Picker.Item
                    label={t + '번'}
                    value={t}
                    key={i}
                  />
                )
              }
              </Picker>
            </Item>
          </Form>
        </Content>
      </Container>
    );
  }

  _onGoBack = () => {
    this.props.navigation.goBack();
  }

  _onAddSchedule = async () => {
    const location = this.state.location;
    let selectedDate = this.state.selectedDate.slice(0);
    const startTime = this.state.startTime;
    const endTime = this.state.endTime;
    const recurringCount = this.state.recurringCount;

    if (!location.length || !selectedDate.length || !startTime === 0 || !endTime === 0) {
      Toast.show({
        text: '모두 기입해 주세요!',
        type: 'danger',
        position: 'bottom',
      });
    } else {
      this.setState({isLoading: true});

      let err = null;
      const refs = [];

      for (let i = 0; i < recurringCount; i++) {
        if (err) break;

        try {
          const ref = await database.ref(`schedules/${moment(selectedDate).format('YYYYMM/DD')}`).push({
            dateString: selectedDate,
            location,
            startTime,
            endTime
          });

          refs.push(ref);
        } catch (e) {
          err = e;
        }

        selectedDate = moment(selectedDate).add(1, 'weeks').format('YYYY-MM-DD')
      }

      this.setState({isLoading: false});

      if (err) {
        for (const ref of refs) await ref.remove();

        Toast.show({
          text: err.toString(),
          type: 'danger',
          position: 'bottom',
        });
      } else {
        Toast.show({
          text: '스케줄이 추가되었습니다!',
          type: 'success',
          position: 'bottom',
        });
        this._onGoBack();
      }
    }
  }

  _onDayPress = (day) => {
    const markedDates = {};

    markedDates[day.dateString] = {selected: true};

    this.setState({markedDates: {...markedDates}, selectedDate: day.dateString});
  }
}
