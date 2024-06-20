import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  readonly WSUrlFileNoti = "ws://localhost:8000/ws/task/";
  readonly WSUrlProjectNoti = "ws://localhost:8000/ws/project/";
  readonly WSUrlProjectData = "ws://localhost:8000/ws/project-data/";
  readonly WSUrlTask = "ws://localhost:8000/ws/task-project/";

  private socket: WebSocket;

  constructor () {
  }

  public connectFileNoti(): Observable<any> {
    this.socket = new WebSocket(this.WSUrlFileNoti);
    return new Observable(observer => {
      this.socket.onmessage = event => observer.next(event.data);
      this.socket.onerror = error => observer.error(error);
    });
  }

  public connectProjectNoti(): Observable<any> {
    this.socket = new WebSocket(this.WSUrlProjectNoti);
    return new Observable(observer => {
      this.socket.onmessage = event => observer.next(event.data);
      this.socket.onerror = error => observer.error(error);
    });
  }
  public connectProjectData(): Observable<any> {
    this.socket = new WebSocket(this.WSUrlProjectData);
    return new Observable(observer => {
      this.socket.onmessage = event => observer.next(event.data);
      this.socket.onerror = error => observer.error(error);
    });
  }
  public connectFileProject(): Observable<any> {
    this.socket = new WebSocket(this.WSUrlTask);
    return new Observable(observer => {
      this.socket.onmessage = event => observer.next(event.data);
      this.socket.onerror = error => observer.error(error);
    });
  }
}
