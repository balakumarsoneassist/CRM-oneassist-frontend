import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TrackNumberService } from '../services/track-number.service';
import { Subscription } from 'rxjs';

interface CallTrackHistory {
  leadid: number;
  createon: string;
  notes: string;
  appoinmentdate: string | null;
  status: string;
  contactfollowedby: number;
  tracknumber: string;
}

@Component({
  selector: 'app-calltrackhistory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calltrackhistory.component.html',
  styleUrls: ['./calltrackhistory.component.css']
})
export class CallTrackHistoryComponent implements OnInit, OnDestroy {
  @Input() tracknumber: string | null = null;
  data: CallTrackHistory[] = [];
  loading = false;
  private trackNumberSubscription?: Subscription;

  constructor(private route: ActivatedRoute, private http: HttpClient, private trackNumberService: TrackNumberService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    // console.log('=== CALLTRACKHISTORY COMPONENT INIT ===');
    // console.log('Initial tracknumber input:', this.tracknumber);
    this.trackNumberService.trackNumber$.subscribe(value => {
      console.log('Received in subscription:', value);
    });
    console.log('After subscription in calltrackhistory component');
    // Subscribe to track number changes from the service
    this.trackNumberSubscription = this.trackNumberService.trackNumber$.subscribe(trackNumber => {
      console.log('Observable received track number:', trackNumber);
      if (trackNumber) {
        // console.log('Track number is valid, calling loadCallHistory');
        this.loadCallHistory(trackNumber);
      } else {
        // console.log('Track number is null/empty, not loading history');
      }
    });

    // Fallback to route param or input property if service doesn't have a value
    const currentFromService = this.trackNumberService.getCurrentTrackNumber();
    const routeParam = this.route.snapshot.paramMap.get('tracknumber');

    // console.log('Current track number from service:', currentFromService);
    // console.log('Route param tracknumber:', routeParam);
    // console.log('Input tracknumber:', this.tracknumber);

    const trackNumber = currentFromService || this.tracknumber || routeParam;

    // console.log('Final resolved track number:', trackNumber);

    if (trackNumber) {
      // console.log('Using fallback track number, calling loadCallHistory');
      this.loadCallHistory(trackNumber);
    } else {
      // console.warn('tracknumber not available from service, route param, or input');
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.trackNumberSubscription) {
      this.trackNumberSubscription.unsubscribe();
    }
  }

  private loadCallHistory(trackNumber: string): void {
    // console.log('=== CALL HISTORY DEBUG START ===');
    // console.log('Loading call history for track number:', trackNumber);

    // Split track number to get only the track number part (before ***)
    const actualTrackNumber = trackNumber.includes('***') ? trackNumber.split('***')[0] : trackNumber;

    console.log('API URL:', `${environment.apiUrl}/callhistorytracklist/${actualTrackNumber}`);
    console.log('Current loading state:', this.loading);

    this.loading = true;
    this.data = []; // Clear existing data
    // console.log('Loading state set to true, data cleared');

    this.http
      .get<CallTrackHistory[]>(`${environment.apiUrl}/callhistorytracklist/${actualTrackNumber}`)
      .subscribe({
        next: (res) => {
          // console.log('=== API SUCCESS ===');
          // console.log('Raw API Response:', res);
          // console.log('Response type:', typeof res);
          // console.log('Is array?', Array.isArray(res));

          this.data = res || [];
          this.loading = false;

          console.log('Data assigned:', this.data);
          console.log('Data length:', this.data.length);
          console.log('Loading state set to false');

          // Force change detection
          this.cdr.detectChanges();
          console.log('Change detection triggered');

          // Add a small delay and check again
          setTimeout(() => {
            // console.log('After timeout - Data length:', this.data.length);
            // console.log('After timeout - Loading state:', this.loading);
            this.cdr.detectChanges();
          }, 100);

          // console.log('=== CALL HISTORY DEBUG END ===');
        },
        error: (err) => {
          // console.log('=== API ERROR ===');
          // console.error('Failed to load call track history', err);
          // console.log('Error status:', err.status);
          // console.log('Error message:', err.message);
          // console.log('Error details:', err);
          this.loading = false;
          // console.log('Loading state set to false due to error');
          // console.log('=== CALL HISTORY DEBUG END ===');
        },
      });
  }
}
