import React from 'react';
import { AsyncStorage, Linking } from "react-native";
import { Constants, Updates } from 'expo';
import { Container, Header, Content, List, Body, Title, ListItem, Text, Right, Icon } from 'native-base';
import minifest from '../app.json';

export default class SettingsScreen extends React.Component {
  state = {
    isAdmin: false,
  };

  async componentWillMount() {
    const isAdmin = await AsyncStorage.getItem('isAdmin') === '1';
    this.setState({isAdmin});
  }

  render() {
    return (
      <Container>
        <Header>
          <Body style={{ alignItems: 'center'}}>
            <Title>설정</Title>
          </Body>
        </Header>
        <Content>
          <List>
            {
              this.state.isAdmin &&
              <ListItem button onPress={this._onPressAnnouncement}>
                <Body>
                  <Text>전체알림</Text>
                </Body>
                <Right>
                  <Icon active name="arrow-forward" />
                </Right>
              </ListItem>
            }
            {
              this.state.isAdmin &&
              <ListItem button onPress={this._onPressTags}>
                <Body>
                  <Text>태그추가</Text>
                </Body>
                <Right>
                  <Icon active name="arrow-forward" />
                </Right>
              </ListItem>
            }
            <ListItem button onPress={this._onPressNotifications}>
              <Body>
                <Text>공지사항</Text>
              </Body>
              <Right>
                <Icon active name="arrow-forward" />
              </Right>
            </ListItem>
            <ListItem button onPress={this._onPressLogout}>
              <Body>
                <Text>로그아웃</Text>
              </Body>
              <Right>
                <Icon active name="log-out" />
              </Right>
            </ListItem>
            <ListItem onPress={this._updateAssets}>
              <Body>
                <Text note>버전</Text>
              </Body>
              <Right>
                <Text note>{Constants.manifest.version}</Text>
              </Right>
            </ListItem>
          </List>
        </Content>
      </Container>
    );
  }

  _updateAssets = async () => {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      Updates.reloadFromCache();
    }
  }

  _onPressNotifications = () => {
    this.props.navigation.push('Notifications');
  }

  _onPressTags = () => {
    this.props.navigation.push('Tag');
  }

  _onPressLogout = async () => {
    await AsyncStorage.clear();
    this.props.navigation.navigate('Login');
  }

  _onPressAnnouncement = () => {
    this.props.navigation.push('Announcement');
  }
}
