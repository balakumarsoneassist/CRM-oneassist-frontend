import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrackNumberService {
  private trackNumberSubject = new BehaviorSubject<string | null>(null);
  
  // Observable that components can subscribe to
  public trackNumber$: Observable<string | null> = this.trackNumberSubject.asObservable();

  constructor() { }

  // Method to emit a new track number
  setTrackNumber(trackNumber: string | null): void {
    console.log('Emitting track number pvr:', trackNumber);
    this.trackNumberSubject.next(trackNumber);
    console.log('After next');
    this.trackNumberSubject.subscribe(value => {
      console.log('Received in subscription:', value);
    });
    console.log('After subscription');
  }

  // Method to get the current track number value
  getCurrentTrackNumber(): string | null {
    return this.trackNumberSubject.value;
  }

  // Method to clear the track number
  clearTrackNumber(): void {
    this.trackNumberSubject.next(null);
  }
}
