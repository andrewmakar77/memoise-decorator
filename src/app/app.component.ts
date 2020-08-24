import { Component, VERSION } from '@angular/core';
import { Memoise } from './memo.decorator';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {

  @Memoise()
  public get name(): string {
    console.log('works once')
    return 'ANGULAR 10';
  }
}
