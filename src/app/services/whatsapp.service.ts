import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WhatsAppService {
    private apiUrl = `${environment.apiUrl}/api/whatsapp`;

    constructor(private http: HttpClient) { }

    sendVerification(mobilenumber: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/send-verification`, { mobilenumber });
    }

    sendTemplate(mobilenumber: string, templateName: string, components: any[] = []): Observable<any> {
        return this.http.post(`${this.apiUrl}/send-template`, { mobilenumber, templateName, components });
    }

    // Note: Webhook is handled entirely by backend/Meta
}
