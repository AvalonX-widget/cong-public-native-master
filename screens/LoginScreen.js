import React from 'react';
import { AsyncStorage } from "react-native";
import { Container, Header, Content, Button, Body, Title, Text, Form, Item, Label, Input } from 'native-base';

export default class LoginScreen extends React.Component {
  constructor(props) {
    super(props);
    this._loginCheckAsync();
  }

  static navigationOptions = {
    header: null
  };

  state = {
    name: '',
  };

  _loginCheckAsync = async () => {
    const userName = await AsyncStorage.getItem('name');
    if (userName) this.props.navigation.navigate('Main');
  }

  render() {
    return (
      <Container>
        <Header>
          <Body style={{ alignItems: 'center'}}>
            <Title>로그인</Title>
          </Body>
        </Header>
        <Content>
          <Form>
            <Item floatingLabel>
              <Label>이름</Label>
              <Input onChangeText={name => this.setState({name})} />
            </Item>

            <Button full primary style={{ margin: 20 }} disabled={this.state.name.length < 2} onPress={this._onPressLogin}>
              <Text>로그인</Text>
            </Button>
          </Form>
        </Content>
      </Container>
    );
  }

  _onPressLogin = () => {
    AsyncStorage.setItem('name', this.state.name);
    this.props.navigation.navigate('Main');
  }
}
