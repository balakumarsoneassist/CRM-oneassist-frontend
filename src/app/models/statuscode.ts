export class StatusCodeDataModel {
    public static ContactStatusDataModel = 
    [
        { Id: 3, Status: 'Following'},
        { Id: 4, Status: 'Approved'},
        { Id: 5, Status: 'Reject'},
        { Id: 22,Status: 'NoResponse'},
        { Id: 24, Status: 'Not Exist/Out of Service'},
    ];
    public static ApproveStatusDataModel = 
    [
        { Id: 12, Status: 'Document Collection'},
    ];
    public static DocumentCollectStatusDataModel = 
    [
        { Id: 12, Status: 'Document Collection'},
        { Id: 23, Status: 'Document Collection Reject'},
        { Id: 13, Status: 'File Login'},
    ];
    public static FileLoginDataModel = 
    [
        { Id: 12, Status: 'Document Collection'},
        { Id: 23, Status: 'Document Collection Reject'},
        { Id: 13, Status: 'File Login'},
        { Id: 14, Status: 'File Login Reject'},
        { Id: 15, Status: 'Sanction'},
    ];
    public static SanctionDataModel = 
    [
        { Id: 12, Status: 'Document Collection'},
        { Id: 23, Status: 'Document Collection Reject'},
        { Id: 13, Status: 'File Login'},
        { Id: 15, Status: 'Sanction'},
        { Id: 16, Status: 'Sanction Reject'},
        { Id: 17, Status: 'Disbursement'},
    ];
    public static DisbursementDataModel = 
    [
        { Id: 12, Status: 'Document Collection'},
        { Id: 13, Status: 'File Login'},
        { Id: 15, Status: 'Sanction'},
        { Id: 17, Status: 'Disbursement'},
        { Id: 18, Status: 'Completed'}
    ];
    public static NewDisbursementDataModel = 
    [
       
        { Id: 17, Status: 'Disbursement'}
    ];
    public static CompeletedDataModel = 
    [
        { Id: 12, Status: 'Document Collection'},
        { Id: 13, Status: 'File Login'},
        { Id: 15, Status: 'Sanction'},
        { Id: 17, Status: 'Disbursement'},
        { Id: 18, Status: 'Completed'},
        { Id: 19, Status: 'Bank Assigned'}
    ];
    public static BankAssignDataModel = 
    [
        { Id: 12, Status: 'Document Collection'},
        { Id: 13, Status: 'File Login'},
        { Id: 15, Status: 'Sanction'},
        { Id: 17, Status: 'Disbursement'},
        { Id: 18, Status: 'Completed'},
        { Id: 19, Status: 'Bank Assigned'},
        { Id: 20, Status: 'Bank Completed'},
        { Id: 21, Status: 'Bank Rejected'}
    ];

}

export class StatusCode {
    Id!: number;
    Status!: string;
}
