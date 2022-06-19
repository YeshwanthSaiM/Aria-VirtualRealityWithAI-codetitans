import { User } from '../users/user.model';
import { Thread } from '../threads/thread.model';
import { Message } from '../messages/message.model';
import { MessagesService } from '../messages/messages.service';
import { ThreadsService } from '../threads/threads.service';
import { UsersService } from '../users/users.service';
import * as moment from 'moment';
import { DirectLine } from 'botframework-directlinejs';
import { environment } from '../../environments/environment';

const directLine = new DirectLine({
  secret: environment.API_KEY
});

const me: User = new User('ARIA', 'assets/avatars/jb.png');
const moneypenny: User = new User('ARIA', 'assets/avatars/mmp.png');
const tMoneyPenny: Thread = new Thread(
  'tMoneyPenny',
  moneypenny.name,
  moneypenny.avatarSrc
);

const initialMessages: Array<Message> = [
  new Message({
    author: moneypenny,
    sentAt: moment()
      .subtract(7, 'minutes')
      .toDate(),
    text: 'Welcome to ARIA',
    thread: tMoneyPenny
  })
];

export class Setup {
  static init(
    messagesService: MessagesService,
    threadsService: ThreadsService,
    usersService: UsersService
  ): void {
    messagesService.messages.subscribe(() => ({}));

    usersService.setCurrentUser(me);

    // Create the initial messages
    initialMessages.map((message: Message) =>
      messagesService.addMessage(message)
    );

    threadsService.setCurrentThread(tMoneyPenny);

    this.setupBots(messagesService);
  }

  static setupBots(messagesService: MessagesService): void {
    // Send our messages to ARIA
    messagesService
      .messagesForThreadUser(tMoneyPenny, moneypenny)
      .forEach((message: Message): void => {
        directLine
          .postActivity({
            from: { id: message.author.name },
            type: 'message',
            text: message.text
          })
          .subscribe(
            id => {},
            error => console.log('Error posting activity', error)
          );
      }, null);

    // Watch incoming messages from our bot
    directLine.activity$
      .filter(
        activity =>
          activity.type === 'message' && activity.from.id === 'missmoneyp'
      )
      .subscribe(message =>
        messagesService.addMessage(
          new Message({
            author: moneypenny,
            text: message['text'],
            thread: tMoneyPenny
          })
        )
      );
  }
}
