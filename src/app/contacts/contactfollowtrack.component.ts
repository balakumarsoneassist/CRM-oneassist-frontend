import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContactFollowupDetailsComponent } from './contactfollowupdetails.component';
import { CallTrackHistoryComponent } from './calltrackhistory.component';

@Component({
  selector: 'app-contactfollowtrack',
  standalone: true,
  imports: [CommonModule, ContactFollowupDetailsComponent, CallTrackHistoryComponent],
  templateUrl: './contactfollowtrack.component.html',
  styleUrls: ['./contactfollowtrack.component.css']
})
export class ContactFollowTrackComponent {
  @Input() tracknumber: string | null = null;
  @Output() closePopup = new EventEmitter<void>(); // Event to notify parent to close popup
  @Output() dataSaved = new EventEmitter<void>(); // Event to notify parent that data was saved
  
  onClosePopup(): void {
    this.closePopup.emit();
  }
  
  onDataSaved(): void {
    this.dataSaved.emit();
  }
}
