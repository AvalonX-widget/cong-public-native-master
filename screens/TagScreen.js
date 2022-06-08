import React from 'react';
import { ListView } from 'react-native';
import { Container, Header, Content, Left, Body, Title, Button, Input, Right, Icon, Item, List, ListItem, Text } from 'native-base';
import { database } from '../config/firebase';

export default class SettingsScreen extends React.Component {
  state = {
    currentTag: '',
    tags: [],
  }

  tagRef = null;
  ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });;

  async componentWillMount() {
    this.tagRef = database.ref('tags');
    this.tagRef.on('value', snap => {
      this.setState({ tags: Object.keys(snap.val() || {}) });
    });
  }

  componentWillUnmount() {
    this.tagRef.off();
  }

  render() {
    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={this._onGoBack}>
              <Icon name='arrow-back' type='MaterialIcons' />
            </Button>
          </Left>
          <Body style={{ alignItems: 'center'}}>
            <Title>태그추가</Title>
          </Body>
          <Right />
        </Header>
        <Content padder>
          <Item>
            <Input placeholder='추가할 태그를 입력해 주세요.' value={this.state.currentTag} onChangeText={currentTag => this.setState({ currentTag })} />
            <Button transparent onPress={this._onPressAdd}>
              <Icon active type='Entypo' name='add-to-list' />
            </Button>
          </Item>
          <List
            rightOpenValue={-75}
            dataSource={this.ds.cloneWithRows(this.state.tags)}
            renderRow={tag =>
              <ListItem>
                <Text>{tag}</Text>
              </ListItem>
            }
            renderRightHiddenRow={(data, secId, rowId, rowMap) =>
              <Button full danger onPress={() => this._onPressDelete(data, secId, rowId, rowMap)}>
                <Icon active name="trash" />
              </Button>
            }
          />
        </Content>
      </Container>
    );
  }

  _onPressDelete = async (tag, secId, rowId, rowMap) => {
    rowMap[`${secId}${rowId}`].props.closeRow();
    await database.ref(`tags/${tag}`).remove();
  }

  _onPressAdd = async () => {
    if (this.state.currentTag.length < 1) return;

    await database.ref(`tags/${this.state.currentTag}`).set(true)
    this.setState({ currentTag: '' })
  }

  _onGoBack = () => {
    this.props.navigation.goBack();
  }
}
