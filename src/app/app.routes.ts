import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EmployeeEntryFormComponent } from './employees/employee-entry-form.component';
import { AuthGuard } from './auth/auth.guard';
import { ContactComponent } from './contacts/contact.component';
import { UnassignedContactsComponent } from './contacts/unassigned-contacts.component';
import { UnassignedLeadsComponent } from './leads/unassignedleads.component';
import { AssignedLeadsComponent } from './leads/assignedleads.component';
import { BranchmasterComponent } from './masters/branchmaster.component';
import { LocationmasterComponent } from './masters/locationmaster.component';
import { BankmasterComponent } from './masters/bankmaster.component';
import { AssignedContactsComponent } from './contacts/assigned-contacts.component';
import { TrackContactsComponent } from './contacts/trackcontacts.component';
import { TrackLeadsComponent } from './leads/trackleads.component';
import { CallTrackHistoryComponent } from './contacts/calltrackhistory.component';
import { ContactFollowupDetailsComponent } from './contacts/contactfollowupdetails.component';
import { ContactFollowTrackComponent } from './contacts/contactfollowtrack.component';
import { EmployeeListComponent } from './employees/employee-list.component';
import { DailyReportComponent } from './reports/daily-report.component';
import { StatusReportSummaryCleanComponent } from './reports/status-report-summary-clean.component';
import { StatusFollowedAllComponent } from './reports/statusfollowedall.component';
import { EmpWiseFollowedListComponent } from './employees/empwisefollowedlist.component';
import { ProfileComponent } from './user/profile.component';
import { CustomerEntryComponent } from './customers/customer-entry.component';
import { CustomerFollowupComponent } from './customers/customer-followup.component';
import { OverallReportComponent } from './reports/overall-report.component';
import { EmployeeCustomerDetailsComponent } from './customers/employee-customer-details.component';
import { ChangePasswordComponent } from './auth/change-password.component';
import { QrCodeGeneratorComponent } from './qr/qr-code-generator.component';
import { ImportDataComponent } from './data/import-data.component';
import { DashboardHomeComponent } from './dashboard/dashboard-home.component';
import { CustomerListComponent } from './customers/customer-list.component';
import { LoanListComponent } from './loans/loan-list.component';
import { QRContactsReportComponent } from './contacts/qr-contacts-report.component';
import { ConnectorComponent } from './connectors/connector.component';
import { ConnectorListComponent } from './connectors/connector-list.component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardHomeComponent }, // Default dashboard home
      { path: 'employee-entry', component: EmployeeEntryFormComponent },
      { path: 'customer-entry', component: CustomerEntryComponent },
      { path: 'customer-followup', component: CustomerFollowupComponent },
      { path: 'overall-report', component: OverallReportComponent },
      { path: 'employee-customer-details', component: EmployeeCustomerDetailsComponent },
      { path: 'change-password', component: ChangePasswordComponent },
      { path: 'qr-code-generator', component: QrCodeGeneratorComponent },
      { path: 'qr-contacts-report', component: QRContactsReportComponent },
      { path: 'import-data', component: ImportDataComponent },
      { path: 'connector', component: ConnectorComponent },
      { path: 'connector-list', component: ConnectorListComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'unassigned-contacts', component: UnassignedContactsComponent },
      { path: 'unassignedleads', component: UnassignedLeadsComponent },
      { path: 'assigned-contacts', component: AssignedContactsComponent },
      { path: 'assignedleads', component: AssignedLeadsComponent },
      { path: 'trackcontacts', component: TrackContactsComponent },
      { path: 'trackleads', component: TrackLeadsComponent },
      { path: 'customer-list', component: CustomerListComponent },
      { path: 'loan-list', component: LoanListComponent },
      { path: 'branchmaster', component: BranchmasterComponent },
      { path: 'employee-list', component: EmployeeListComponent },
      { path: 'daily-report', component: DailyReportComponent },
      { path: 'status-report-summary', component: StatusReportSummaryCleanComponent },
      { path: 'statusfollowedall/:statuscode', component: StatusFollowedAllComponent },
      { path: 'empwisefollowedlist/:empid/:statuscode', component: EmpWiseFollowedListComponent },
      { path: 'bankmaster', component: BankmasterComponent },
      { path: 'locationmaster', component: LocationmasterComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'calltrackhistory/:tracknumber', component: CallTrackHistoryComponent },
      { path: 'contactfollowupdetails', component: ContactFollowupDetailsComponent },
      { path: 'contactfollowtrack/:tracknumber', component: ContactFollowTrackComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
