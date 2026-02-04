import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

interface ChecklistItem {
    id: string;
    label: string;
    checked: boolean;
    belongsTo?: 'company' | 'partner' | 'both';
}

@Component({
    selector: 'app-checklist',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './checklist.component.html',
    styleUrls: ['./checklist.component.css']
})
export class ChecklistComponent implements OnInit {
    activeMode: 'checklist' | 'questionnaire' = 'checklist';
    employmentType: string = 'salaried';
    subType: string = 'proprietorship';
    classifyType: string = 'company';
    ltdType: string = 'company';

    salariedChecklist: ChecklistItem[] = [
        { id: 's1', label: 'Pan card', checked: false },
        { id: 's2', label: 'Aadhaar card', checked: false },
        { id: 's3', label: 'Current address proof', checked: false },
        { id: 's4', label: 'Latest 4 months payslips', checked: false },
        { id: 's5', label: 'Bonus credit payslip and bank statement', checked: false },
        { id: 's6', label: 'Latest 6 months salary credit bank statement', checked: false },
        { id: 's7', label: 'Latest year form 16 (Part A & B)', checked: false },
        { id: 's8', label: 'Work experience proof or offer letter', checked: false },
        { id: 's9', label: 'Company ID card', checked: false },
        { id: 's10', label: 'PF statement (If applicable) or Form 26 AS for latest year', checked: false }
    ];

    proprietorshipChecklist: ChecklistItem[] = [
        { id: 'p1', label: 'Pan card or Form 60 Mandatory', checked: false },
        { id: 'p2', label: 'Identity Proof (Pan card, Aadhaar card, Passport, Driving License and Voter ID)', checked: false },
        { id: 'p3', label: 'Address proof (Aadhaar card, Passport, Driving License and Voter ID)', checked: false },
        { id: 'p4', label: 'Current Address Proof (Gas Bill, Rental agreement, telephone bill)', checked: false },
        { id: 'p5', label: 'Business Proof (GST certificate, Udyam registration or Registration certificate)', checked: false },
        { id: 'p6', label: 'Last 3yrs ITR full set (Computation of Total Income, P&L, Balance sheet)', checked: false },
        { id: 'p7', label: 'Last 18months GSTR -3B', checked: false },
        { id: 'p8', label: 'Last 12 months current account statement', checked: false },
        { id: 'p9', label: 'Last 12 months savings account statement', checked: false },
        { id: 'p10', label: 'Own house proof mandatory', checked: false },
        { id: 'p11', label: 'Client details and company profile', checked: false },
        { id: 'p12', label: 'All Loan sanction letter and loan statement', checked: false }
    ];

    partnershipChecklist: ChecklistItem[] = [
        { id: 'pt1', label: 'Partnership deed', checked: false, belongsTo: 'company' },
        { id: 'pt2', label: 'Company pan card', checked: false, belongsTo: 'company' },
        { id: 'pt3', label: 'Business Proof (GST certificate, Udyam registration or Registration certificate)', checked: false, belongsTo: 'company' },
        { id: 'pt4', label: 'Pan card or Form 60 Mandatory (Partners)', checked: false, belongsTo: 'partner' },
        { id: 'pt5', label: 'Identity Proof (Pan card, Aadhaar card, Passport, Driving License and Voter ID)', checked: false, belongsTo: 'partner' },
        { id: 'pt6', label: 'Address proof (Aadhaar card, Passport, Driving License and Voter ID)', checked: false, belongsTo: 'partner' },
        { id: 'pt7', label: 'Current Address Proof (Gas Bill, Rental agreement, telephone bill)', checked: false, belongsTo: 'partner' },
        { id: 'pt8', label: 'Last 3yrs ITR full set (Computation of Total Income, P&L, Balance sheet) of company and individuals', checked: false, belongsTo: 'company' },
        { id: 'pt9', label: 'Last 18months GSTR -3B', checked: false, belongsTo: 'company' },
        { id: 'pt10', label: 'Last 12 months current account statement', checked: false, belongsTo: 'company' },
        { id: 'pt11', label: 'Last 12 months savings account statement of partners', checked: false, belongsTo: 'company' },
        { id: 'pt12', label: 'Own house proof mandatory', checked: false, belongsTo: 'partner' },
        { id: 'pt13', label: 'Client details and company profile', checked: false, belongsTo: 'company' },
        { id: 'pt14', label: 'All Loan sanction letter and loan statement', checked: false, belongsTo: 'both' }
    ];

    companyChecklist: ChecklistItem[] = [
        { id: 'cl1', label: 'Company pan card', checked: false, belongsTo: 'company' },
        { id: 'cl2', label: 'MOA (Memorandum of Association)', checked: false, belongsTo: "company" },
        { id: 'cl3', label: 'AOA (Article of Association)', checked: false, belongsTo: "company" },
        { id: 'cl4', label: 'Certificate of Incorporation', checked: false, belongsTo: "company" },
        { id: 'cl5', label: 'List of directors in company letter head', checked: false, belongsTo: "company" },
        { id: 'cl6', label: 'Share of directors in company letter head', checked: false, belongsTo: "company" },
        { id: 'cl7', label: 'Business Proof (GST certificate, Udyam registration or Registration certificate)', checked: false, belongsTo: "company" },
        { id: 'cl8', label: 'Pan card or Form 60 Mandatory (Directors)', checked: false, belongsTo: "partner" },
        { id: 'cl9', label: 'Identity Proof (Pan card, Aadhaar card, Passport, Driving License and Voter ID)', checked: false, belongsTo: 'partner' },
        { id: 'cl10', label: 'Address proof (Aadhaar card, Passport, Driving License and Voter ID)', checked: false, belongsTo: 'partner' },
        { id: 'cl11', label: 'Current Address Proof (Gas Bill, Rental agreement, telephone bill)', checked: false, belongsTo: 'partner' },
        { id: 'cl12', label: 'Last 3yrs ITR full set (Computation of Total Income, P&L, Balance sheet) of company and directors', checked: false, belongsTo: 'company' },
        { id: 'cl13', label: 'Last 18months GSTR -3B', checked: false, belongsTo: 'company' },
        { id: 'cl14', label: 'Last 12 months current account statement', checked: false, belongsTo: 'company' },
        { id: 'cl15', label: 'Last 12 months savings account statement of directors', checked: false, belongsTo: 'company' },
        { id: 'cl16', label: 'Own house proof mandatory', checked: false, belongsTo: 'partner' },
        { id: 'cl17', label: 'Client details and company profile', checked: false, belongsTo: 'company' },
        { id: 'cl18', label: 'All Loan sanction letter and loan statement', checked: false, belongsTo: 'both' }
    ];

    doctorChecklist: ChecklistItem[] = [
        { id: 'dr1', label: 'Degree certificate', checked: false },
        { id: 'dr2', label: 'College ID card', checked: false },
        { id: 'dr3', label: 'Course completion certificate', checked: false },
        { id: 'dr4', label: 'Clinic address proof', checked: false },
        { id: 'dr5', label: 'Clinic Letterhead', checked: false },
        { id: 'dr6', label: 'IMA registration certificate', checked: false },
        { id: 'dr7', label: 'Pan card or Form 60 Mandatory', checked: false },
        { id: 'dr8', label: 'Identity Proof (Pan card, Aadhaar card, Passport, Driving License and Voter ID)', checked: false },
        { id: 'dr9', label: 'Address proof (Aadhaar card, Passport, Driving License and Voter ID)', checked: false },
        { id: 'dr10', label: 'Current Address Proof (Gas Bill, Rental agreement, telephone bill)', checked: false },
        { id: 'dr11', label: 'Business Proof (GST certificate, Udyam registration or Registration certificate)', checked: false },
        { id: 'dr12', label: 'Last 3yrs ITR full set (Computation of Total Income, P&L, Balance sheet)', checked: false },
        { id: 'dr13', label: 'Last 18months GSTR -3B', checked: false },
        { id: 'dr14', label: 'Last 12 months current account statement (If available)', checked: false },
        { id: 'dr15', label: 'Last 12 months savings account statement', checked: false },
        { id: 'dr16', label: 'Own house proof mandatory', checked: false },
        { id: 'dr17', label: 'All Loan sanction letter and loan statement', checked: false }
    ];

    auditorChecklist: ChecklistItem[] = [
        { id: 'au1', label: 'Degree Certificate', checked: false },
        { id: 'au2', label: 'Auditor Membership ID', checked: false },
        { id: 'au3', label: 'Pan card or Form 60 Mandatory', checked: false },
        { id: 'au4', label: 'Identity Proof (Pan card, Aadhaar card, Passport, Driving License and Voter ID)', checked: false },
        { id: 'au5', label: 'Address proof (Aadhaar card, Passport, Driving License and Voter ID)', checked: false },
        { id: 'au6', label: 'Current Address Proof (Gas Bill, Rental agreement, telephone bill)', checked: false },
        { id: 'au7', label: 'Business Proof (GST certificate, Udyam registration or Registration certificate)', checked: false },
        { id: 'au8', label: 'Last 3yrs ITR full set (Computation of Total Income, P&L, Balance sheet)', checked: false },
        { id: 'au9', label: 'Last 18months GSTR -3B', checked: false },
        { id: 'au10', label: 'Last 12 months current account statement (If available)', checked: false },
        { id: 'au11', label: 'Last 12 months savings account statement', checked: false },
        { id: 'au12', label: 'Own house proof mandatory', checked: false },
        { id: 'au13', label: 'All Loan sanction letter and loan statement', checked: false }
    ];

    propertyDocumentsChecklist: ChecklistItem[] = [
        { id: 'pd1', label: 'Sale agreement(in case of property purchase)', checked: false },
        { id: 'pd2', label: 'Sale deed in present owner name', checked: false },
        { id: 'pd3', label: 'Previous sale deeds', checked: false },
        { id: 'pd4', label: 'EC from 1-1-1987 to till date', checked: false },
        { id: 'pd5', label: 'Latest property taxes', checked: false },
        { id: 'pd6', label: 'Approved building plan', checked: false },
        { id: 'pd7', label: 'Construction estimate certified by licensed engineer(for self construction proposals)', checked: false },
        { id: 'pd8', label: 'Patta in the name of the present', checked: false },
    ];
    currentChecklist: ChecklistItem[] = [];
    filteredChecklist: ChecklistItem[] = [];
    filteredltdChecklist: ChecklistItem[] = [];

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            const type = params['type'];

            if (type === 'salaried') {
                this.employmentType = 'salaried';
                this.subType = 'proprietorship';
                this.classifyType = 'company';
                this.ltdType = 'company';
                this.updateChecklist();
            }
            else if (type === 'self-employed') {
                this.employmentType = 'self-employed';

                this.subType = 'proprietorship';
                this.classifyType = 'company';
                this.ltdType = 'company';
                this.updateChecklist();
                this.updatePartnershipChecklist();
                this.updateLtdChecklist();
            }
            else if (type === 'property-documents') {
                this.activeMode = 'checklist';
                this.employmentType = 'property-documents';
                this.subType = 'proprietorship';
                this.classifyType = 'company';
                this.ltdType = 'company';
                this.updateChecklist();
            }
        });
    }


    updateChecklist() {
        if (this.employmentType === 'salaried') {
            this.currentChecklist = this.salariedChecklist;
        } else if (this.employmentType === 'property-documents') {
            this.activeMode = 'checklist';
            this.currentChecklist = this.propertyDocumentsChecklist;
        } else if (this.employmentType === 'self-employed') {
            switch (this.subType) {
                case 'proprietorship': this.currentChecklist = this.proprietorshipChecklist; break;
                case 'partnership': this.currentChecklist = this.partnershipChecklist; break;
                case 'company': this.currentChecklist = this.companyChecklist; break;
                case 'doctor': this.currentChecklist = this.doctorChecklist; break;
                case 'auditor': this.currentChecklist = this.auditorChecklist; break;
                default: this.currentChecklist = this.proprietorshipChecklist;
            }
        }

    }

    updatePartnershipChecklist() {
        this.filteredChecklist = this.partnershipChecklist.filter(
            item => item.belongsTo === this.classifyType || item.belongsTo === 'both'
        );
    }

    updateLtdChecklist() {
        this.filteredltdChecklist = this.companyChecklist.filter(
            item => item.belongsTo === this.ltdType || item.belongsTo === 'both'
        );
    }

    setSubType(type: string) {
        this.subType = type;
        this.updateChecklist();
    }
    setClassifyType(type: string) {
        this.classifyType = type;
        this.updatePartnershipChecklist();
    }

    setLtdType(type: string) {
        this.ltdType = type;
        this.updateLtdChecklist();
    }

    setActiveMode(mode: 'checklist' | 'questionnaire') {
        this.activeMode = mode;
    }

    resetChecklist() {
        this.currentChecklist.forEach(item => item.checked = false);
    }
}
